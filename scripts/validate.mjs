import { readFile } from "node:fs/promises";
import { access } from "node:fs/promises";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const clone = (value) => JSON.parse(JSON.stringify(value));
const WORK_MODE_IDS = ["presentation", "activity", "test"];
const ACTIVITY_TYPES = new Set(["true_false", "matching", "fill_blank"]);
const TEST_SECTION_TYPES = new Set(["topic_test", "new_generation", "past_exam"]);
const DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const isText = (value) => typeof value === "string" && value.trim().length > 0;
const requirePackageMetadata = (data, label) => {
  for (const field of ["schemaVersion", "topicId", "gradeId", "unitId", "title"]) {
    if (!isText(data?.[field])) throw new Error(`${label}: ${field} alanı geçersiz`);
  }
};
const catalog = await readJson("data/catalog.json");

if (!Array.isArray(catalog.grades) || !Array.isArray(catalog.curriculumProfiles)) {
  throw new Error("catalog.json veri sözleşmesine uymuyor");
}

const getGradeLevel = (gradeId) => {
  const grade = catalog.grades.find((item) => item.id === gradeId);
  const match = String(grade?.label ?? gradeId).match(/(?:^|\D)([5-8])(?:\D|$)/);
  return match ? Number(match[1]) : null;
};

const validateActivityPackage = (data) => {
  requirePackageMetadata(data, "Etkinlik paketi");
  if (!Array.isArray(data.activities)) throw new Error("Etkinlik paketi: activities dizisi geçersiz");
  const activityIds = new Set();

  for (const activity of data.activities) {
    if (!isText(activity.id) || activityIds.has(activity.id)) throw new Error("Etkinlik kimlikleri geçersiz veya yinelenmiş");
    activityIds.add(activity.id);
    if (!ACTIVITY_TYPES.has(activity.type)) throw new Error(`${activity.id}: desteklenmeyen etkinlik türü`);
    if (!isText(activity.title) || !isText(activity.instruction) || !Number.isInteger(activity.order)) {
      throw new Error(`${activity.id}: ortak etkinlik alanları geçersiz`);
    }

    if (activity.type === "true_false") {
      if (!Array.isArray(activity.items) || !activity.items.length) throw new Error(`${activity.id}: items dizisi boş veya geçersiz`);
      for (const item of activity.items) {
        if (!isText(item.id) || !isText(item.statement) || typeof item.answer !== "boolean" || !isText(item.explanation)) {
          throw new Error(`${activity.id}: true_false öğesi geçersiz`);
        }
      }
    }

    if (activity.type === "matching") {
      if (!Array.isArray(activity.pairs) || !activity.pairs.length) throw new Error(`${activity.id}: pairs dizisi boş veya geçersiz`);
      const pairIds = new Set();
      for (const pair of activity.pairs) {
        if (!isText(pair.id) || pairIds.has(pair.id) || !isText(pair.left) || !isText(pair.right)) {
          throw new Error(`${activity.id}: eşleştirme çifti geçersiz`);
        }
        pairIds.add(pair.id);
      }
    }

    if (activity.type === "fill_blank") {
      if (!Array.isArray(activity.items) || !activity.items.length) throw new Error(`${activity.id}: items dizisi boş veya geçersiz`);
      for (const item of activity.items) {
        if (!isText(item.id) || !isText(item.text) || !Array.isArray(item.blanks) || !item.blanks.length) {
          throw new Error(`${activity.id}: fill_blank öğesi geçersiz`);
        }
        const placeholderIds = new Set([...item.text.matchAll(/{{\s*([A-Za-z0-9_-]+)\s*}}/g)].map((match) => match[1]));
        const blankIds = new Set();
        for (const blank of item.blanks) {
          if (!isText(blank.id) || blankIds.has(blank.id) || !isText(blank.answer)) {
            throw new Error(`${activity.id}: boşluk tanımı geçersiz`);
          }
          blankIds.add(blank.id);
        }
        if (placeholderIds.size !== blankIds.size || [...placeholderIds].some((id) => !blankIds.has(id))) {
          throw new Error(`${activity.id}: placeholder ve blank kimlikleri eşleşmiyor`);
        }
      }
    }
  }
};

const validateTestPackage = (data) => {
  requirePackageMetadata(data, "Test paketi");
  if (!Array.isArray(data.sections)) throw new Error("Test paketi: sections dizisi geçersiz");
  const gradeLevel = getGradeLevel(data.gradeId);
  const sectionIds = new Set();

  for (const section of data.sections) {
    if (!isText(section.id) || sectionIds.has(section.id) || !isText(section.title) || !Array.isArray(section.questions)) {
      throw new Error("Test bölümü alanları geçersiz veya yinelenmiş");
    }
    sectionIds.add(section.id);
    if (!TEST_SECTION_TYPES.has(section.type)) throw new Error(`${section.id}: desteklenmeyen test bölümü türü`);
    if (section.type === "past_exam" && gradeLevel !== 8) {
      throw new Error(`${section.id}: past_exam yalnızca 8. sınıfta kullanılabilir`);
    }

    const questionIds = new Set();
    for (const question of section.questions) {
      if (!isText(question.id) || questionIds.has(question.id) || !isText(question.question) ||
          !isText(question.explanation) || !isText(question.subtopic)) {
        throw new Error(`${section.id}: soru alanları geçersiz veya kimlik yinelenmiş`);
      }
      questionIds.add(question.id);
      if (!DIFFICULTIES.has(question.difficulty)) throw new Error(`${question.id}: difficulty değeri geçersiz`);
      if (!Array.isArray(question.options) || question.options.length < 2) throw new Error(`${question.id}: seçenekler geçersiz`);
      const optionIds = new Set();
      for (const option of question.options) {
        if (!isText(option.id) || optionIds.has(option.id) || !isText(option.text)) throw new Error(`${question.id}: seçenek geçersiz`);
        optionIds.add(option.id);
      }
      if (!optionIds.has(question.correctOption)) throw new Error(`${question.id}: correctOption mevcut seçeneklerden biri değil`);

      if (section.type === "past_exam") {
        if (question.sourceType !== "past_exam" || question.exam !== "LGS" ||
            !Number.isInteger(question.year) || !isText(question.source)) {
          throw new Error(`${question.id}: çıkmış soru kaynak metadata alanları geçersiz`);
        }
      }
    }
  }
};

for (const profile of catalog.curriculumProfiles) {
  const curriculum = await readJson(profile.source.replace(/^\.\//, ""));
  if (curriculum.profileId !== profile.id || !Array.isArray(curriculum.units)) {
    throw new Error(`${profile.id} profili geçersiz`);
  }
  for (const unit of curriculum.units) {
    if (!unit.id || !Array.isArray(unit.topics)) throw new Error(`${profile.id} içinde geçersiz ünite bulundu`);
    for (const topic of unit.topics) {
      if (!topic.id || !topic.workModes) throw new Error(`${unit.id} içinde çalışma modları tanımsız konu bulundu`);
      for (const modeId of WORK_MODE_IDS) {
        const mode = topic.workModes[modeId];
        if (!mode || typeof mode.status !== "string") {
          throw new Error(`${topic.id} konusu için ${modeId} modu geçersiz`);
        }
        if (mode.source) await access(mode.source.replace(/^\.\//, ""));
      }
    }
  }
}

const existingLesson = await readJson("data/lessons/mevsimlerin-olusumu.json");
const existingSlides = existingLesson.stages.flatMap((stage) => stage.slides ?? []);
if (existingSlides.length !== 25) throw new Error("Mevsimlerin Oluşumu sunumundaki 25 slayt korunmalıdır");
const datesSlide = existingSlides.find((slide) => slide.id === "slide_10_mevsim_tarihleri_tablosu");
if (!datesSlide?.interactions?.some((interaction) => interaction.type === "reveal_fill")) {
  throw new Error("Mevsim Tarihleri tablosunun reveal_fill etkileşimi korunmalıdır");
}

const expectValid = (label, validator, fixture) => {
  try {
    validator(fixture);
  } catch (error) {
    throw new Error(`${label} geçerli fixture olmasına rağmen reddedildi: ${error.message}`);
  }
};

const expectInvalid = (label, validator, fixture) => {
  try {
    validator(fixture);
  } catch {
    return;
  }
  throw new Error(`${label} geçersiz fixture olmasına rağmen kabul edildi`);
};

const activityTemplate = await readJson("data/activities/activity-template.json");
const activityFixture = (type) => ({
  ...clone(activityTemplate),
  activities: [clone(activityTemplate.activities.find((activity) => activity.type === type))]
});

expectValid("true_false", validateActivityPackage, activityFixture("true_false"));
expectValid("matching", validateActivityPackage, activityFixture("matching"));
expectValid("fill_blank", validateActivityPackage, activityFixture("fill_blank"));

const invalidTrueFalse = activityFixture("true_false");
invalidTrueFalse.activities[0].items[0].answer = "true";
expectInvalid("string cevaplı true_false", validateActivityPackage, invalidTrueFalse);

const invalidMatching = activityFixture("matching");
delete invalidMatching.activities[0].pairs[0].right;
expectInvalid("eksik eşleştirme çifti", validateActivityPackage, invalidMatching);

const invalidFillBlank = activityFixture("fill_blank");
invalidFillBlank.activities[0].items[0].blanks[0].id = "differentBlank";
expectInvalid("uyuşmayan fill_blank kimliği", validateActivityPackage, invalidFillBlank);

const invalidActivityType = activityFixture("true_false");
invalidActivityType.activities[0].type = "unsupported_activity";
expectInvalid("desteklenmeyen etkinlik türü", validateActivityPackage, invalidActivityType);

const testTemplate = await readJson("data/tests/test-template.json");
const pastExamQuestion = {
  ...clone(testTemplate.sections.find((section) => section.type === "topic_test").questions[0]),
  id: "fixture_past_exam_question",
  sourceType: "past_exam",
  exam: "LGS",
  year: 2025,
  source: "Fixture kaynak kaydı"
};
const testFixture = (gradeId, type) => {
  const section = clone(testTemplate.sections.find((item) => item.type === type));
  if (type === "past_exam") section.questions = [clone(pastExamQuestion)];
  return { ...clone(testTemplate), gradeId, sections: [section] };
};

expectValid("6. sınıf topic_test", validateTestPackage, testFixture("grade_6", "topic_test"));
expectValid("7. sınıf new_generation", validateTestPackage, testFixture("grade_7", "new_generation"));
expectValid("8. sınıf past_exam", validateTestPackage, testFixture("grade_8", "past_exam"));

expectInvalid("6. sınıf past_exam", validateTestPackage, testFixture("grade_6", "past_exam"));

const invalidCorrectOption = testFixture("grade_6", "topic_test");
invalidCorrectOption.sections[0].questions[0].correctOption = "missing-option";
expectInvalid("olmayan correctOption", validateTestPackage, invalidCorrectOption);

const invalidDifficulty = testFixture("grade_7", "new_generation");
invalidDifficulty.sections[0].questions[0].difficulty = "extreme";
expectInvalid("geçersiz difficulty", validateTestPackage, invalidDifficulty);

const invalidPastExamMetadata = testFixture("grade_8", "past_exam");
delete invalidPastExamMetadata.sections[0].questions[0].source;
delete invalidPastExamMetadata.sections[0].questions[0].year;
delete invalidPastExamMetadata.sections[0].questions[0].exam;
expectInvalid("eksik past_exam metadata", validateTestPackage, invalidPastExamMetadata);

const invalidSectionType = testFixture("grade_6", "topic_test");
invalidSectionType.sections[0].type = "unsupported_test";
expectInvalid("desteklenmeyen test bölümü", validateTestPackage, invalidSectionType);

await Promise.all([
  "index.html",
  "src/app.js",
  "src/core/work-modes.js",
  "src/engines/annotation-engine.js",
  "src/layers/storage.js",
  "data/lessons/lesson-template.json",
  "data/activities/activity-template.json",
  "data/tests/test-template.json"
].map((path) => access(path)));

console.log("Veri sözleşmeleri ve zorunlu dosyalar geçerli.");
console.log("Fixture kontrolleri: 6 geçerli ve 9 geçersiz senaryo başarıyla doğrulandı.");
