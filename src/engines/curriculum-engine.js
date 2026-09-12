export class CurriculumEngine {
  #catalog = null;

  async loadCatalog(url = "./data/catalog.json") {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Katalog yüklenemedi (${response.status})`);
    const data = await response.json();
    this.#validateCatalog(data);
    this.#catalog = data;
    return data;
  }

  getCatalog() {
    return this.#catalog;
  }

  getGrades() {
    return this.#catalog?.grades ?? [];
  }

  getGrade(gradeId) {
    return this.getGrades().find((grade) => grade.id === gradeId) ?? null;
  }

  getProfile(profileId) {
    return this.#catalog?.curriculumProfiles?.find((profile) => profile.id === profileId) ?? null;
  }

  async loadCurriculum(profileId) {
    const profile = this.getProfile(profileId);
    if (!profile?.source) return { profileId, units: [] };
    const response = await fetch(profile.source, { cache: "no-store" });
    if (!response.ok) throw new Error(`Müfredat profili yüklenemedi: ${profileId}`);
    const curriculum = await response.json();
    this.#validateCurriculum(curriculum, profileId);
    return curriculum;
  }

  #validateCatalog(data) {
    if (!data || !Array.isArray(data.grades) || !Array.isArray(data.curriculumProfiles)) {
      throw new TypeError("Geçersiz katalog veri yapısı");
    }
  }

  #validateCurriculum(data, profileId) {
    if (data?.profileId !== profileId || !Array.isArray(data.units)) {
      throw new TypeError(`Geçersiz müfredat veri yapısı: ${profileId}`);
    }
  }
}
