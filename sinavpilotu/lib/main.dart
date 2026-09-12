import 'dart:async';
import 'package:flutter/material.dart';

void main() => runApp(const App());
const navy = Color(0xff17324d),
    blue = Color(0xff246bfd),
    mint = Color(0xff28a67a),
    coral = Color(0xfff2775c),
    bg = Color(0xfff5f7f9),
    line = Color(0xffe2e7ec),
    muted = Color(0xff687685),
    soft = Color(0xffeaf1ff);

class App extends StatelessWidget {
  const App({super.key});
  @override
  Widget build(BuildContext c) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: 'SınavPilotu',
    theme: ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(seedColor: blue),
      scaffoldBackgroundColor: bg,
      appBarTheme: const AppBarTheme(
        backgroundColor: bg,
        surfaceTintColor: Colors.transparent,
        foregroundColor: navy,
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontSize: 30,
          fontWeight: FontWeight.w900,
          letterSpacing: -1,
          color: navy,
        ),
        headlineSmall: TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w800,
          color: navy,
        ),
        titleLarge: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w800,
          color: navy,
        ),
        bodyMedium: TextStyle(color: muted, height: 1.4),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: line),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: line),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(0, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(0, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          side: const BorderSide(color: line),
        ),
      ),
    ),
    home: const Shell(),
  );
}

class Shell extends StatefulWidget {
  const Shell({super.key});
  @override
  State<Shell> createState() => _Shell();
}

class _Shell extends State<Shell> {
  int i = 0;
  final students = [
    'Ali Yılmaz',
    'Ayşe Demir',
    'Berk Kaya',
    'Ceren Ak',
    'Deniz Arslan',
  ];
  @override
  Widget build(BuildContext c) {
    final pages = [
      Home(go: (x) => setState(() => i = x)),
      Classes(names: students),
      const Analytics(),
      const Settings(),
    ];
    return Scaffold(
      body: SafeArea(
        child: IndexedStack(index: i, children: pages),
      ),
      bottomNavigationBar: NavigationBar(
        height: 70,
        selectedIndex: i,
        indicatorColor: soft,
        onDestinationSelected: (x) => setState(() => i = x),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Ana Sayfa',
          ),
          NavigationDestination(
            icon: Icon(Icons.groups_outlined),
            selectedIcon: Icon(Icons.groups),
            label: 'Sınıflar',
          ),
          NavigationDestination(
            icon: Icon(Icons.bar_chart_outlined),
            selectedIcon: Icon(Icons.bar_chart),
            label: 'Analizler',
          ),
          NavigationDestination(icon: Icon(Icons.tune), label: 'Ayarlar'),
        ],
      ),
    );
  }
}

Widget frame(Widget child) => Center(
  child: ConstrainedBox(
    constraints: const BoxConstraints(maxWidth: 760),
    child: child,
  ),
);
void push(BuildContext c, Widget page) =>
    Navigator.push(c, MaterialPageRoute(builder: (_) => page));

class Head extends StatelessWidget {
  final String title;
  final String? side;
  const Head(this.title, {this.side, super.key});
  @override
  Widget build(BuildContext c) => Row(
    children: [
      Expanded(child: Text(title, style: Theme.of(c).textTheme.titleLarge)),
      if (side != null)
        Text(side!, style: const TextStyle(color: muted, fontSize: 12)),
    ],
  );
}

class Note extends StatelessWidget {
  final String text;
  const Note(this.text, {super.key});
  @override
  Widget build(BuildContext c) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: const Color(0xffeef3f7),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(Icons.info_outline, size: 19, color: muted),
        const SizedBox(width: 9),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(color: muted, fontSize: 12.5, height: 1.4),
          ),
        ),
      ],
    ),
  );
}

class Steps extends StatelessWidget {
  final int n, total;
  final String text;
  const Steps(this.n, this.total, this.text, {super.key});
  @override
  Widget build(BuildContext c) => Row(
    children: [
      Text(
        '$n / $total',
        style: const TextStyle(color: blue, fontWeight: FontWeight.w900),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: LinearProgressIndicator(
          value: n / total,
          minHeight: 4,
          backgroundColor: line,
          color: blue,
          borderRadius: BorderRadius.circular(5),
        ),
      ),
      const SizedBox(width: 10),
      Text(
        text,
        style: const TextStyle(
          fontSize: 10,
          color: muted,
          fontWeight: FontWeight.w800,
          letterSpacing: .7,
        ),
      ),
    ],
  );
}

class Home extends StatelessWidget {
  final ValueChanged<int> go;
  const Home({required this.go, super.key});
  @override
  Widget build(BuildContext c) => frame(
    ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: navy,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.document_scanner, color: Colors.white),
            ),
            const SizedBox(width: 11),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'SINAVPİLOTU',
                    style: TextStyle(
                      color: navy,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.2,
                    ),
                  ),
                  Text(
                    'Ahmet Yılmaz · Fen Bilimleri',
                    style: TextStyle(color: muted, fontSize: 12),
                  ),
                ],
              ),
            ),
            IconButton.filledTonal(
              onPressed: () => go(3),
              icon: const Icon(Icons.person_outline),
            ),
          ],
        ),
        const SizedBox(height: 30),
        Text(
          'Sınavları daha hızlı\ndeğerlendirin.',
          style: Theme.of(c).textTheme.headlineLarge,
        ),
        const SizedBox(height: 8),
        const Text(
          'Kağıtları tarayın, puanları kontrol edin ve sınıfınızın gelişimini görün.',
          style: TextStyle(color: muted, height: 1.45),
        ),
        const SizedBox(height: 24),
        ActionCard(
          color: blue,
          icon: Icons.edit_note,
          title: 'Açık Uçlu Sınav',
          sub: 'Cevap anahtarı oluştur, kağıtları tara ve değerlendir.',
          tap: () => push(c, const OpenStart()),
        ),
        const SizedBox(height: 12),
        ActionCard(
          color: navy,
          icon: Icons.fact_check_outlined,
          title: 'Çoktan Seçmeli Test',
          sub: 'Cevap anahtarını gir ve hızlı sonuç al.',
          tap: () => push(c, const TestSetup()),
        ),
        const SizedBox(height: 27),
        const Head('Son işlem', side: '1 aktif sınav'),
        const SizedBox(height: 10),
        InkWell(
          onTap: () => push(c, const Scanner()),
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: line),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Row(
              children: [
                Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 48,
                      height: 48,
                      child: CircularProgressIndicator(
                        value: .63,
                        strokeWidth: 5,
                        backgroundColor: soft,
                        color: blue,
                      ),
                    ),
                    Text(
                      '63%',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '8-A · Fen Bilimleri',
                        style: TextStyle(
                          color: navy,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        '1. Dönem 1. Yazılı',
                        style: TextStyle(color: muted, fontSize: 12),
                      ),
                      SizedBox(height: 7),
                      Text(
                        '19 / 30 öğrenci tamamlandı',
                        style: TextStyle(
                          color: blue,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, color: muted),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}

class ActionCard extends StatelessWidget {
  final Color color;
  final IconData icon;
  final String title, sub;
  final VoidCallback tap;
  const ActionCard({
    required this.color,
    required this.icon,
    required this.title,
    required this.sub,
    required this.tap,
    super.key,
  });
  @override
  Widget build(BuildContext c) => Material(
    color: color,
    borderRadius: BorderRadius.circular(18),
    child: InkWell(
      onTap: tap,
      borderRadius: BorderRadius.circular(18),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: .14),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: Colors.white),
            ),
            const SizedBox(width: 15),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    sub,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: .75),
                      fontSize: 12.5,
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward, color: Colors.white),
          ],
        ),
      ),
    ),
  );
}

class OpenStart extends StatelessWidget {
  const OpenStart({super.key});
  @override
  Widget build(BuildContext c) => Scaffold(
    appBar: AppBar(title: const Text('Açık Uçlu Sınav')),
    body: frame(
      ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Steps(1, 3, 'CEVAP ANAHTARI'),
          const SizedBox(height: 20),
          Text(
            'Nasıl başlamak istersiniz?',
            style: Theme.of(c).textTheme.headlineSmall,
          ),
          const SizedBox(height: 7),
          const Text(
            'Size en hızlı gelen yöntemi seçin. Sonradan düzenleyebilirsiniz.',
            style: TextStyle(color: muted),
          ),
          const SizedBox(height: 20),
          Choice(
            Icons.document_scanner_outlined,
            'Cevap Anahtarını Tara',
            'Kendi çözdüğünüz sınav kağıdını tarayın. Model cevaplar otomatik hazırlansın.',
            'EN HIZLI',
            () => push(c, const KeyBuilder(scanned: true)),
          ),
          const SizedBox(height: 12),
          Choice(
            Icons.keyboard_alt_outlined,
            'Sistem Üzerinden Oluştur',
            'Soru puanlarını, kazanımları ve model cevapları elle girin.',
            null,
            () => push(c, const KeyBuilder(scanned: false)),
          ),
          const SizedBox(height: 22),
          const Note(
            'Bu prototip gerçek görüntü işleme yapmaz; tarama akışını güvenli bir kamera simülasyonu ile gösterir.',
          ),
        ],
      ),
    ),
  );
}

class Choice extends StatelessWidget {
  final IconData icon;
  final String title, sub;
  final String? tag;
  final VoidCallback tap;
  const Choice(
    this.icon,
    this.title,
    this.sub,
    this.tag,
    this.tap, {
    super.key,
  });
  @override
  Widget build(BuildContext c) => Material(
    color: Colors.white,
    borderRadius: BorderRadius.circular(16),
    child: InkWell(
      onTap: tap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          border: Border.all(color: line),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: soft,
                borderRadius: BorderRadius.circular(13),
              ),
              child: Icon(icon, color: blue),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (tag != null)
                    Text(
                      tag!,
                      style: const TextStyle(
                        color: blue,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  Text(
                    title,
                    style: const TextStyle(
                      color: navy,
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    sub,
                    style: const TextStyle(
                      color: muted,
                      fontSize: 12.5,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: muted),
          ],
        ),
      ),
    ),
  );
}

class KeyBuilder extends StatefulWidget {
  final bool scanned;
  const KeyBuilder({required this.scanned, super.key});
  @override
  State<KeyBuilder> createState() => _KeyBuilder();
}

class _KeyBuilder extends State<KeyBuilder> {
  int i = 0;
  final points = [10, 10, 15, 15],
      out = ['F.8.1.1.1', 'F.8.1.1.1', 'F.8.1.2.1', 'F.8.1.2.2'];
  @override
  Widget build(BuildContext c) => Scaffold(
    appBar: AppBar(
      title: Text(widget.scanned ? 'Tarama Sonucu' : 'Cevap Anahtarı'),
    ),
    body: frame(
      Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 5, 20, 12),
            child: const Steps(1, 3, '4 SORU · 50 PUAN'),
          ),
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: 4,
              separatorBuilder: (_, _) => const SizedBox(width: 7),
              itemBuilder: (_, x) => ChoiceChip(
                label: Text('Soru ${x + 1}'),
                selected: x == i,
                showCheckmark: false,
                onSelected: (_) => setState(() => i = x),
              ),
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Soru ${i + 1}',
                        style: Theme.of(c).textTheme.headlineSmall,
                      ),
                    ),
                    if (widget.scanned)
                      const Chip(label: Text('Taramadan geldi')),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        key: ValueKey('p-$i-${points[i]}'),
                        initialValue: '${points[i]}',
                        keyboardType: TextInputType.number,
                        onChanged: (value) {
                          final parsed = int.tryParse(value);
                          if (parsed != null) points[i] = parsed;
                        },
                        decoration: const InputDecoration(
                          labelText: 'Soru puanı',
                          suffixText: 'puan',
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextFormField(
                        key: ValueKey('o-$i-${out[i]}'),
                        initialValue: out[i],
                        onChanged: (value) => out[i] = value,
                        decoration: const InputDecoration(
                          labelText: 'Kazanım / çıktı',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 7,
                  children: [
                    ActionChip(
                      label: const Text('Son kullanılan: F.8.1.1.1'),
                      onPressed: () => setState(() => out[i] = 'F.8.1.1.1'),
                    ),
                    ActionChip(
                      label: const Text('Son puan: 10'),
                      onPressed: () => setState(() => points[i] = 10),
                    ),
                  ],
                ),
                const SizedBox(height: 13),
                TextFormField(
                  key: ValueKey('a$i'),
                  initialValue: [
                    'Dünya’nın eksen eğikliği ve Güneş etrafında dolanması sonucunda mevsimler oluşur.',
                    'Güneş ışınlarının geliş açısı küçüldükçe birim yüzeye düşen enerji azalır.',
                    'İki yarım kürede aynı tarihte farklı mevsimler yaşanır.',
                    '21 Haziran’da Kuzey Yarım Küre en uzun gündüzü yaşar.',
                  ][i],
                  minLines: 6,
                  maxLines: 8,
                  decoration: const InputDecoration(
                    labelText: 'Model / doğru cevap',
                    alignLabelWithHint: true,
                  ),
                ),
                const SizedBox(height: 15),
                const Note(
                  'Kısa ve gözlenebilir ölçütler içeren model cevaplar, puan önerisini daha anlaşılır kılar.',
                ),
              ],
            ),
          ),
          BottomAppBar(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 14),
            child: Row(
              children: [
                if (i > 0)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setState(() => i--),
                      child: const Text('Önceki'),
                    ),
                  ),
                if (i > 0) const SizedBox(width: 9),
                Expanded(
                  flex: 2,
                  child: FilledButton(
                    onPressed: () {
                      if (i < 3) {
                        setState(() => i++);
                      } else {
                        push(c, const ScanSetup());
                      }
                    },
                    child: Text(
                      i < 3 ? 'Kaydet ve Sonraki' : 'Öğrencileri Taramaya Geç',
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class ScanSetup extends StatefulWidget {
  const ScanSetup({super.key});

  @override
  State<ScanSetup> createState() => _ScanSetup();
}

class _ScanSetup extends State<ScanSetup> {
  String selectedClass = '8-A';
  String selectedStudent = 'Berk Kaya';

  @override
  Widget build(BuildContext context) {
    const students = [
      ('Ali Yılmaz', 'tamamlandı', Icons.check_circle, mint),
      ('Ayşe Demir', 'tamamlandı', Icons.check_circle, mint),
      ('Berk Kaya', 'bekliyor', Icons.circle_outlined, blue),
      ('Ceren Ak', 'kontrol gerekli', Icons.error_outline, Color(0xffff9800)),
      ('Deniz Arslan', 'sınava girmedi', Icons.remove_circle_outline, muted),
    ];
    return Scaffold(
      appBar: AppBar(title: const Text('Öğrenci Seçimi')),
      body: frame(
        Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 5, 20, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Steps(2, 3, 'SINIF VE ÖĞRENCİ'),
                  const SizedBox(height: 20),
                  Text(
                    'Hangi sınıfı tarıyorsunuz?',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    children: ['5-A', '6-B', '7-A', '8-A']
                        .map(
                          (value) => ChoiceChip(
                            label: Text(value),
                            selected: selectedClass == value,
                            showCheckmark: false,
                            onSelected: (_) =>
                                setState(() => selectedClass = value),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.all(20),
                itemCount: students.length,
                separatorBuilder: (_, _) => const Divider(height: 1),
                itemBuilder: (_, index) {
                  final student = students[index];
                  final selected = student.$1 == selectedStudent;
                  return ListTile(
                    minVerticalPadding: 12,
                    contentPadding: EdgeInsets.zero,
                    onTap: student.$2 == 'sınava girmedi'
                        ? null
                        : () => setState(() => selectedStudent = student.$1),
                    leading: Icon(student.$3, color: student.$4),
                    title: Text(
                      student.$1,
                      style: const TextStyle(
                        color: navy,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    subtitle: Text(student.$2),
                    trailing: selected
                        ? const Icon(Icons.radio_button_checked, color: blue)
                        : const Icon(Icons.chevron_right, color: muted),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 18),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () => push(
                    context,
                    Scanner(
                      studentName: selectedStudent,
                      className: selectedClass,
                    ),
                  ),
                  icon: const Icon(Icons.document_scanner_outlined),
                  label: Text('$selectedStudent için Taramayı Başlat'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

enum Phase { front, fronting, turn, back, backing, done }

class Scanner extends StatefulWidget {
  final String studentName;
  final String className;
  const Scanner({
    this.studentName = 'Berk Kaya',
    this.className = '8-A',
    super.key,
  });
  @override
  State<Scanner> createState() => _Scanner();
}

class _Scanner extends State<Scanner> {
  Phase p = Phase.front;
  Timer? t;
  late String studentName = widget.studentName;
  void scan() {
    setState(() => p = p == Phase.front ? Phase.fronting : Phase.backing);
    t = Timer(const Duration(milliseconds: 1100), () {
      if (mounted) {
        setState(() => p = p == Phase.fronting ? Phase.turn : Phase.done);
      }
    });
  }

  @override
  void dispose() {
    t?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext c) {
    final waiting = p == Phase.fronting || p == Phase.backing,
        done = p == Phase.done,
        turn = p == Phase.turn;
    return Scaffold(
      backgroundColor: const Color(0xff101c29),
      appBar: AppBar(
        backgroundColor: const Color(0xff101c29),
        foregroundColor: Colors.white,
        title: const Text('Seri Tarama'),
        actions: [
          TextButton.icon(
            onPressed: () async {
              final selected = await showModalBottomSheet<String>(
                context: c,
                showDragHandle: true,
                builder: (_) => const StudentList(),
              );
              if (selected != null && mounted) {
                setState(() {
                  studentName = selected;
                  p = Phase.front;
                });
              }
            },
            icon: const Icon(Icons.people, color: Colors.white),
            label: const Text('Liste', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(18),
              child: Row(
                children: [
                  const CircleAvatar(
                    backgroundColor: Color(0xff27394a),
                    child: Icon(Icons.person, color: Colors.white),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          studentName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Text(
                          '${widget.className} · seri tarama',
                          style: const TextStyle(
                            color: Color(0xff9aabb9),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Text(
                    'OTOMATİK ÇEKİM',
                    style: TextStyle(
                      color: Color(0xff75a5ff),
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 20),
                decoration: BoxDecoration(
                  color: const Color(0xff1a2938),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    if (!turn && !done)
                      Container(
                        width: 260,
                        height: 360,
                        padding: const EdgeInsets.all(20),
                        color: const Color(0xfff5f1e8),
                        child: Column(
                          children: [
                            Container(height: 8, color: navy),
                            const SizedBox(height: 20),
                            ...List.generate(
                              8,
                              (i) => Padding(
                                padding: const EdgeInsets.only(bottom: 16),
                                child: Container(
                                  height: i.isEven ? 5 : 14,
                                  color: const Color(0xffd6d1c8),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    if (turn)
                      const CircleAvatar(
                        radius: 46,
                        backgroundColor: blue,
                        child: Icon(Icons.flip, size: 46, color: Colors.white),
                      ),
                    if (done)
                      const CircleAvatar(
                        radius: 46,
                        backgroundColor: mint,
                        child: Icon(Icons.check, size: 48, color: Colors.white),
                      ),
                    if (waiting)
                      const SizedBox(
                        width: 70,
                        height: 70,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 4,
                        ),
                      ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(22),
              child: Column(
                children: [
                  Text(
                    switch (p) {
                      Phase.front => 'Ön yüzü hizalayın',
                      Phase.fronting => 'Kağıt algılandı',
                      Phase.turn => 'Ön yüz tamamlandı',
                      Phase.back => 'Arka yüzü hizalayın',
                      Phase.backing => 'Kağıt algılandı',
                      Phase.done => 'Sınav tamamlandı',
                    },
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 21,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    turn
                        ? 'Kağıdı çevirin ve arka yüzü gösterin.'
                        : done
                        ? '$studentName için iki yüz de kaydedildi.'
                        : 'Kağıdın dört köşesini çerçevenin içine alın.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Color(0xffa9b5c0)),
                  ),
                  const SizedBox(height: 17),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: waiting
                          ? null
                          : () {
                              if (p == Phase.front || p == Phase.back) {
                                scan();
                              } else if (p == Phase.turn) {
                                setState(() => p = Phase.back);
                              } else {
                                push(c, Review(studentName: studentName));
                              }
                            },
                      child: Text(
                        turn
                            ? 'Arka Yüzü Tara'
                            : done
                            ? 'Puanları Kontrol Et'
                            : 'Otomatik Çekimi Başlat',
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class StudentList extends StatelessWidget {
  const StudentList({super.key});
  @override
  Widget build(BuildContext c) => SafeArea(
    child: Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('8-A öğrenci listesi', style: Theme.of(c).textTheme.titleLarge),
          ...[
            '✓  Ali Yılmaz — tamamlandı',
            '✓  Ayşe Demir — tamamlandı',
            '○  Berk Kaya — bekliyor',
            '⚠  Ceren Ak — kontrol gerekli',
            '—  Deniz Arslan — sınava girmedi',
          ].map(
            (x) => ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(x, style: const TextStyle(color: navy)),
              onTap: x.contains('sınava girmedi')
                  ? null
                  : () =>
                        Navigator.pop(c, x.split('  ').last.split(' —').first),
            ),
          ),
        ],
      ),
    ),
  );
}

class Review extends StatefulWidget {
  final String studentName;
  const Review({this.studentName = 'Berk Kaya', super.key});
  @override
  State<Review> createState() => _Review();
}

class _Review extends State<Review> {
  int i = 0, score = 7;
  bool edit = false;
  final raw = [6.6, 8.4, 11.5, 13.2], max = [10, 10, 15, 15];
  @override
  Widget build(BuildContext c) {
    final rounded = raw[i].round();
    if (!edit) score = rounded;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Puanları Kontrol Et'),
        actions: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              '${i + 1} / 4',
              style: const TextStyle(color: blue, fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
      body: frame(
        Column(
          children: [
            LinearProgressIndicator(
              value: (i + 1) / 4,
              minHeight: 4,
              backgroundColor: line,
              color: blue,
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  Text(
                    'Soru ${i + 1}',
                    style: Theme.of(c).textTheme.headlineSmall,
                  ),
                  Text(
                    '${max[i]} puan · F.8.1.${i < 2 ? '1.1' : '2.${i - 1}'}',
                    style: const TextStyle(color: muted),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: line),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Text(
                      'Dünya’nın ekseni eğiktir ve Güneş’in etrafında dolanırken ışınların geliş açısı değişir. Bu yüzden mevsimler oluşur.',
                      style: TextStyle(color: navy, height: 1.5),
                    ),
                  ),
                  const SizedBox(height: 13),
                  Container(
                    padding: const EdgeInsets.all(17),
                    decoration: BoxDecoration(
                      color: soft,
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            const Expanded(
                              child: Text(
                                'AI değerlendirmesi',
                                style: TextStyle(fontWeight: FontWeight.w800),
                              ),
                            ),
                            Text(
                              '%${(raw[i] / max[i] * 100).round()}',
                              style: const TextStyle(
                                color: blue,
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        LinearProgressIndicator(
                          value: raw[i] / max[i],
                          minHeight: 8,
                          backgroundColor: Colors.white,
                          color: blue,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Temel nedenleri doğru ilişkilendirmiş. “Yıllık dolanma” ifadesi açıkça belirtilmiş.',
                          style: TextStyle(color: muted, fontSize: 12.5),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Center(
                    child: Text(
                      'ÖNERİLEN PUAN',
                      style: TextStyle(
                        color: muted,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  Center(
                    child: Text(
                      '$score / ${max[i]}',
                      style: const TextStyle(
                        color: navy,
                        fontSize: 42,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  Center(
                    child: Text(
                      '${raw[i].toStringAsFixed(1).replaceAll('.', ',')} → $rounded · öğrenci lehine yuvarlandı',
                      style: const TextStyle(
                        color: mint,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  if (edit)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        IconButton.outlined(
                          onPressed: score > 0
                              ? () => setState(() => score--)
                              : null,
                          icon: const Icon(Icons.remove),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(22),
                          child: Text(
                            '$score',
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                        IconButton.outlined(
                          onPressed: score < max[i]
                              ? () => setState(() => score++)
                              : null,
                          icon: const Icon(Icons.add),
                        ),
                      ],
                    ),
                ],
              ),
            ),
            BottomAppBar(
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 14),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setState(() => edit = !edit),
                      child: Text(edit ? 'Vazgeç' : 'Değiştir'),
                    ),
                  ),
                  const SizedBox(width: 9),
                  Expanded(
                    flex: 2,
                    child: FilledButton(
                      onPressed: () {
                        if (i < 3) {
                          setState(() {
                            i++;
                            edit = false;
                          });
                        } else {
                          push(c, Complete(studentName: widget.studentName));
                        }
                      },
                      child: Text(
                        edit ? 'Kaydet ve Sonraki' : 'Onayla ve Sonraki',
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class Complete extends StatelessWidget {
  final String studentName;
  const Complete({this.studentName = 'Berk Kaya', super.key});
  @override
  Widget build(BuildContext c) => Scaffold(
    body: frame(
      Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircleAvatar(
              radius: 44,
              backgroundColor: Color(0xffdff5ec),
              child: Icon(Icons.check, color: mint, size: 46),
            ),
            const SizedBox(height: 22),
            Text(
              '$studentName tamamlandı',
              style: Theme.of(c).textTheme.headlineSmall,
            ),
            const Text(
              'Toplam puan: 40 / 50',
              style: TextStyle(color: muted, fontSize: 16),
            ),
            const SizedBox(height: 25),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => push(c, const Scanner()),
                child: const Text('Sıradaki Öğrenci · Ceren Ak'),
              ),
            ),
            const SizedBox(height: 9),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.popUntil(c, (r) => r.isFirst),
                child: const Text('Ana Sayfaya Dön'),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class TestSetup extends StatefulWidget {
  const TestSetup({super.key});
  @override
  State<TestSetup> createState() => _TestSetup();
}

class _TestSetup extends State<TestSetup> {
  int n = 20;
  @override
  Widget build(BuildContext c) => Scaffold(
    appBar: AppBar(title: const Text('Çoktan Seçmeli Test')),
    body: frame(
      ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Steps(1, 2, 'TEST BİLGİLERİ'),
          const SizedBox(height: 20),
          Text('Yeni test', style: Theme.of(c).textTheme.headlineSmall),
          const SizedBox(height: 16),
          const TextField(decoration: InputDecoration(labelText: 'Test adı')),
          const SizedBox(height: 10),
          DropdownButtonFormField(
            initialValue: 'Fen Bilimleri',
            decoration: const InputDecoration(labelText: 'Ders · isteğe bağlı'),
            items: [
              'Türkçe',
              'Matematik',
              'Fen Bilimleri',
            ].map((x) => DropdownMenuItem(value: x, child: Text(x))).toList(),
            onChanged: (_) {},
          ),
          const SizedBox(height: 10),
          DropdownButtonFormField<String>(
            decoration: const InputDecoration(
              labelText: 'Sınıf · isteğe bağlı',
            ),
            items: [
              '5-A',
              '6-B',
              '7-A',
              '8-A',
            ].map((x) => DropdownMenuItem(value: x, child: Text(x))).toList(),
            onChanged: (_) {},
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: line),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Soru sayısı',
                        style: TextStyle(
                          color: navy,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        'V1 · A / B / C / D',
                        style: TextStyle(color: muted, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                IconButton.outlined(
                  onPressed: n > 5 ? () => setState(() => n -= 5) : null,
                  icon: const Icon(Icons.remove),
                ),
                Padding(
                  padding: const EdgeInsets.all(14),
                  child: Text(
                    '$n',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                IconButton.outlined(
                  onPressed: () => setState(() => n += 5),
                  icon: const Icon(Icons.add),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () => push(c, TestKey(n)),
            child: const Text('Cevap Anahtarını Oluştur'),
          ),
        ],
      ),
    ),
  );
}

class TestKey extends StatefulWidget {
  final int n;
  const TestKey(this.n, {super.key});
  @override
  State<TestKey> createState() => _TestKey();
}

class _TestKey extends State<TestKey> {
  late final a = List.generate(widget.n, (i) => ['A', 'C', 'B', 'D'][i % 4]);
  @override
  Widget build(BuildContext c) => Scaffold(
    appBar: AppBar(title: const Text('Cevap Anahtarı')),
    body: frame(
      Column(
        children: [
          const Padding(
            padding: EdgeInsets.all(20),
            child: Steps(2, 2, 'A / B / C / D'),
          ),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(20),
              gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                maxCrossAxisExtent: 370,
                mainAxisExtent: 62,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              itemCount: a.length,
              itemBuilder: (_, i) => Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border.all(color: line),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    SizedBox(
                      width: 30,
                      child: Text(
                        '${i + 1}',
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                    ),
                    ...['A', 'B', 'C', 'D'].map(
                      (x) => Expanded(
                        child: InkWell(
                          onTap: () => setState(() => a[i] = x),
                          child: Container(
                            margin: const EdgeInsets.all(2),
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: a[i] == x ? blue : bg,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              x,
                              style: TextStyle(
                                color: a[i] == x ? Colors.white : navy,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => push(c, const TestResult()),
                child: const Text('Test Kağıdını Tara'),
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

class TestResult extends StatelessWidget {
  const TestResult({super.key});
  @override
  Widget build(BuildContext c) => Scaffold(
    appBar: AppBar(title: const Text('Test Sonucu')),
    body: frame(
      ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'KAĞIT 1',
            style: TextStyle(color: blue, fontWeight: FontWeight.w800),
          ),
          Text(
            '1. Dönem Tarama Testi',
            style: Theme.of(c).textTheme.headlineSmall,
          ),
          const SizedBox(height: 20),
          const Row(
            children: [
              Expanded(child: Metric('18', 'Doğru', mint)),
              SizedBox(width: 8),
              Expanded(child: Metric('2', 'Yanlış', coral)),
              SizedBox(width: 8),
              Expanded(child: Metric('0', 'Boş', muted)),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: navy,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('NET', style: TextStyle(color: Colors.white70)),
                      Text(
                        '17,33',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'Doğru başarısı  %90',
                      style: TextStyle(color: Colors.white),
                    ),
                    Text(
                      'Net başarısı  %87',
                      style: TextStyle(color: Color(0xff76dab4)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          const Note('Net hesabı: Doğru − Yanlış / 3  ·  18 − 2 / 3 = 17,33'),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () => Navigator.popUntil(c, (r) => r.isFirst),
            child: const Text('Sonucu Kaydet'),
          ),
        ],
      ),
    ),
  );
}

class Metric extends StatelessWidget {
  final String v, l;
  final Color color;
  const Metric(this.v, this.l, this.color, {super.key});
  @override
  Widget build(BuildContext c) => Container(
    padding: const EdgeInsets.symmetric(vertical: 16),
    decoration: BoxDecoration(
      color: Colors.white,
      border: Border.all(color: line),
      borderRadius: BorderRadius.circular(13),
    ),
    child: Column(
      children: [
        Text(
          v,
          style: TextStyle(
            color: color,
            fontSize: 25,
            fontWeight: FontWeight.w900,
          ),
        ),
        Text(l, style: const TextStyle(color: muted, fontSize: 11)),
      ],
    ),
  );
}

class Classes extends StatefulWidget {
  final List<String> names;
  const Classes({required this.names, super.key});
  @override
  State<Classes> createState() => _Classes();
}

class _Classes extends State<Classes> {
  String cls = '8-A';
  @override
  Widget build(BuildContext c) => frame(
    Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 22, 20, 12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Sınıflar',
                      style: Theme.of(c).textTheme.headlineLarge,
                    ),
                    const Text(
                      'Excel’den aktarılan 4 sınıf · 116 öğrenci',
                      style: TextStyle(color: muted, fontSize: 12),
                    ),
                  ],
                ),
              ),
              FilledButton.icon(
                onPressed: () => add(c),
                icon: const Icon(Icons.person_add),
                label: const Text('Öğrenci Ekle'),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 45,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: 4,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (_, i) {
              final x = ['5-A', '6-B', '7-A', '8-A'][i];
              return ChoiceChip(
                label: Text(x),
                selected: cls == x,
                showCheckmark: false,
                onSelected: (_) => setState(() => cls = x),
              );
            },
          ),
        ),
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.all(20),
            itemCount: widget.names.length,
            separatorBuilder: (_, _) => const Divider(),
            itemBuilder: (_, i) => ListTile(
              contentPadding: EdgeInsets.zero,
              leading: CircleAvatar(
                backgroundColor: i < 2
                    ? const Color(0xffdff5ec)
                    : i == 3
                    ? const Color(0xffffefd2)
                    : soft,
                child: Icon(
                  i < 2
                      ? Icons.check
                      : i == 3
                      ? Icons.priority_high
                      : Icons.circle_outlined,
                  color: i < 2
                      ? mint
                      : i == 3
                      ? Colors.orange
                      : blue,
                ),
              ),
              title: Text(
                widget.names[i],
                style: const TextStyle(
                  color: navy,
                  fontWeight: FontWeight.w700,
                ),
              ),
              subtitle: Text(
                'No ${128 + i * 7} · ${i < 2
                    ? 'tamamlandı'
                    : i == 3
                    ? 'kontrol gerekli'
                    : i == 4
                    ? 'sınava girmedi'
                    : 'bekliyor'}',
              ),
            ),
          ),
        ),
      ],
    ),
  );
  void add(BuildContext c) {
    final x = TextEditingController();
    showModalBottomSheet(
      context: c,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (b) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          0,
          20,
          MediaQuery.viewInsetsOf(b).bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '$cls sınıfına öğrenci ekle',
              style: Theme.of(c).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            const TextField(
              keyboardType: TextInputType.number,
              decoration: InputDecoration(labelText: 'Numara'),
            ),
            const SizedBox(height: 9),
            TextField(
              controller: x,
              decoration: const InputDecoration(labelText: 'Ad Soyad'),
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () {
                  if (x.text.isNotEmpty) {
                    setState(() => widget.names.add(x.text));
                  }
                  Navigator.pop(b);
                },
                child: const Text('Öğrenciyi Ekle'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class Analytics extends StatelessWidget {
  const Analytics({super.key});
  @override
  Widget build(BuildContext c) => frame(
    ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'Analizler',
                style: Theme.of(c).textTheme.headlineLarge,
              ),
            ),
            OutlinedButton.icon(
              onPressed: () => push(c, const Report()),
              icon: const Icon(Icons.description_outlined),
              label: const Text('Rapor'),
            ),
          ],
        ),
        const Text(
          '8-A · Fen Bilimleri · 1. Dönem 1. Yazılı',
          style: TextStyle(color: muted),
        ),
        const SizedBox(height: 20),
        const Row(
          children: [
            Expanded(child: Metric('%78', 'Başarı', blue)),
            SizedBox(width: 6),
            Expanded(child: Metric('39,2', 'Ortalama', navy)),
            SizedBox(width: 6),
            Expanded(child: Metric('48', 'En yüksek', mint)),
            SizedBox(width: 6),
            Expanded(child: Metric('21', 'En düşük', coral)),
          ],
        ),
        const SizedBox(height: 23),
        const Head('Soru başarı oranları'),
        const SizedBox(height: 10),
        const Bars(),
        const SizedBox(height: 23),
        const Head('Kazanım başarıları'),
        const SizedBox(height: 10),
        ...[
          ['F.8.1.1.1', 'Mevsimlerin oluşumu', .81],
          ['F.8.1.2.1', 'İklim ve hava olayları', .69],
          ['F.8.1.2.2', 'İklim bilimi', .76],
        ].map(
          (r) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: [
                SizedBox(
                  width: 95,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${r[0]}',
                        style: const TextStyle(
                          color: navy,
                          fontWeight: FontWeight.w800,
                          fontSize: 11,
                        ),
                      ),
                      Text(
                        '${r[1]}',
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: muted, fontSize: 10),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: LinearProgressIndicator(
                    value: r[2] as double,
                    minHeight: 10,
                    backgroundColor: line,
                    color: (r[2] as double) < .7 ? coral : blue,
                    borderRadius: BorderRadius.circular(5),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '%${((r[2] as double) * 100).round()}',
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 15),
        Row(
          children: [
            const Expanded(child: Head('Öğrenci–soru tablosu')),
            TextButton(
              onPressed: () => push(c, const TablePage()),
              child: const Text('Tümünü Aç'),
            ),
          ],
        ),
        const MiniTable(),
      ],
    ),
  );
}

class Bars extends StatelessWidget {
  const Bars({super.key});
  @override
  Widget build(BuildContext c) => Container(
    height: 180,
    padding: const EdgeInsets.all(15),
    decoration: BoxDecoration(
      color: Colors.white,
      border: Border.all(color: line),
      borderRadius: BorderRadius.circular(15),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: List.generate(4, (i) {
        final v = [.88, .74, .69, .81][i];
        return Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Text(
                '%${(v * 100).round()}',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 5),
              Container(
                width: 34,
                height: 100 * v,
                decoration: BoxDecoration(
                  color: i == 2
                      ? coral
                      : i == 3
                      ? mint
                      : blue,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(6),
                  ),
                ),
              ),
              const SizedBox(height: 5),
              Text('S${i + 1}'),
            ],
          ),
        );
      }),
    ),
  );
}

class MiniTable extends StatelessWidget {
  final bool rotateOutcomes;
  const MiniTable({this.rotateOutcomes = false, super.key});
  @override
  Widget build(BuildContext c) {
    final rows = [
      ['Ali Yılmaz', '8', '9', '12', '10', '39'],
      ['Ayşe Demir', '10', '8', '14', '13', '45'],
      ['Berk Kaya', '7', '8', '11', '14', '40'],
      ['Ceren Ak', '6', '7', '10', '12', '35'],
    ];
    Widget cell(
      String value, {
      bool strong = false,
      Color? color,
      bool rotated = false,
    }) => Container(
      alignment: Alignment.centerLeft,
      constraints: BoxConstraints(minHeight: rotated ? 72 : 34),
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 6),
      child: rotated
          ? RotatedBox(
              quarterTurns: 3,
              child: Text(
                value,
                style: TextStyle(
                  color: color ?? navy,
                  fontSize: 9,
                  fontWeight: strong ? FontWeight.w800 : FontWeight.w500,
                ),
              ),
            )
          : Text(
              value,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: color ?? navy,
                fontSize: 9.5,
                fontWeight: strong ? FontWeight.w800 : FontWeight.w500,
              ),
            ),
    );
    TableRow dataRow(
      List<String> values, {
      Color? background,
      bool strong = false,
      bool outcomes = false,
    }) => TableRow(
      decoration: BoxDecoration(color: background),
      children: values
          .asMap()
          .entries
          .map(
            (entry) => cell(
              entry.value,
              strong: strong || entry.key == 0 || entry.key == 5,
              color: background == navy ? Colors.white : null,
              rotated:
                  outcomes && rotateOutcomes && entry.key > 0 && entry.key < 5,
            ),
          )
          .toList(),
    );
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: line),
        borderRadius: BorderRadius.circular(13),
      ),
      child: Table(
        border: const TableBorder(
          horizontalInside: BorderSide(color: line, width: .7),
        ),
        columnWidths: const {0: FlexColumnWidth(2.2), 5: FlexColumnWidth(1.2)},
        children: [
          dataRow(
            ['Öğrenci', 'S1', 'S2', 'S3', 'S4', 'Toplam'],
            background: navy,
            strong: true,
          ),
          dataRow(
            ['Kazanım', 'F.8.1.1.1', 'F.8.1.1.1', 'F.8.1.2.1', 'F.8.1.2.2', ''],
            background: soft,
            outcomes: true,
          ),
          dataRow(
            ['Tam puan', '10', '10', '15', '15', '50'],
            background: const Color(0xfff1f4f7),
            strong: true,
          ),
          ...rows.map(dataRow),
          dataRow(
            ['Başarı', '%78', '%80', '%78', '%82', '%78'],
            background: const Color(0xffe8f6f1),
            strong: true,
          ),
        ],
      ),
    );
  }
}

class TablePage extends StatelessWidget {
  const TablePage({super.key});
  @override
  Widget build(BuildContext c) => Scaffold(
    appBar: AppBar(title: const Text('Öğrenci–Soru Tablosu')),
    body: const SingleChildScrollView(
      padding: EdgeInsets.all(20),
      scrollDirection: Axis.horizontal,
      child: SizedBox(width: 560, child: MiniTable()),
    ),
  );
}

class Report extends StatelessWidget {
  const Report({super.key});
  @override
  Widget build(BuildContext c) => Scaffold(
    appBar: AppBar(title: const Text('Rapor Önizleme')),
    body: frame(
      Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                SegmentedButton(
                  segments: const [
                    ButtonSegment(
                      value: 'PDF',
                      label: Text('PDF'),
                      icon: Icon(Icons.picture_as_pdf),
                    ),
                    ButtonSegment(
                      value: 'Word',
                      label: Text('Word'),
                      icon: Icon(Icons.description),
                    ),
                  ],
                  selected: const {'PDF'},
                  onSelectionChanged: (_) {},
                ),
                const Spacer(),
                IconButton.outlined(
                  onPressed: () => ScaffoldMessenger.of(c).showSnackBar(
                    const SnackBar(
                      content: Text('Prototipte gerçek dosya oluşturulmaz.'),
                    ),
                  ),
                  icon: const Icon(Icons.ios_share),
                ),
              ],
            ),
          ),
          Expanded(
            child: Container(
              color: const Color(0xffdfe3e8),
              padding: const EdgeInsets.all(18),
              child: SingleChildScrollView(
                child: Center(
                  child: Container(
                    width: 520,
                    padding: const EdgeInsets.all(28),
                    color: Colors.white,
                    child: const Column(
                      children: [
                        Text(
                          '2026–2027 Eğitim Öğretim Yılı\nAtatürk Ortaokulu\n8-A Sınıfı Fen Bilimleri Dersi\n1. Dönem 1. Yazılı Analizi',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: navy,
                            fontWeight: FontWeight.w800,
                            height: 1.4,
                          ),
                        ),
                        SizedBox(height: 17),
                        Row(
                          children: [
                            Expanded(child: Metric('28', 'Öğrenci', navy)),
                            SizedBox(width: 6),
                            Expanded(child: Metric('39,2', 'Ortalama', blue)),
                            SizedBox(width: 6),
                            Expanded(child: Metric('%78', 'Başarı', mint)),
                          ],
                        ),
                        SizedBox(height: 18),
                        Bars(),
                        SizedBox(height: 16),
                        MiniTable(rotateOutcomes: true),
                        SizedBox(height: 40),
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                children: [
                                  Divider(),
                                  Text(
                                    'Ahmet Yılmaz',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  Text(
                                    'Fen Bilimleri Öğrt.',
                                    style: TextStyle(fontSize: 10),
                                  ),
                                ],
                              ),
                            ),
                            SizedBox(width: 50),
                            Expanded(
                              child: Column(
                                children: [
                                  Divider(),
                                  Text(
                                    'Mehmet Kaya',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  Text(
                                    'Okul Müdürü',
                                    style: TextStyle(fontSize: 10),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

class Settings extends StatefulWidget {
  const Settings({super.key});
  @override
  State<Settings> createState() => _Settings();
}

class _Settings extends State<Settings> {
  final courses = [
    'Türkçe',
    'Matematik',
    'Fen Bilimleri',
    'Sosyal Bilgiler',
    'T.C. İnkılap Tarihi ve Atatürkçülük',
    'İngilizce',
    'Din Kültürü ve Ahlak Bilgisi',
  ];
  @override
  Widget build(BuildContext c) => frame(
    ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('Ayarlar', style: Theme.of(c).textTheme.headlineLarge),
        const Text(
          'Raporlarda kullanılacak öğretmen ve okul bilgileri.',
          style: TextStyle(color: muted),
        ),
        const SizedBox(height: 20),
        const Head('Öğretmen ve okul'),
        const SizedBox(height: 10),
        ...[
          'Ahmet Yılmaz',
          'Fen Bilimleri',
          'Atatürk Ortaokulu',
          'Mehmet Kaya',
        ].asMap().entries.map(
          (e) => Padding(
            padding: const EdgeInsets.only(bottom: 9),
            child: TextFormField(
              initialValue: e.value,
              decoration: InputDecoration(
                labelText: [
                  'Öğretmen adı soyadı',
                  'Branş',
                  'Okul adı',
                  'Okul müdürü adı soyadı',
                ][e.key],
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            const Expanded(child: Head('Dersler')),
            TextButton.icon(
              onPressed: () => _addCourse(c),
              icon: const Icon(Icons.add),
              label: const Text('Ders Ekle'),
            ),
          ],
        ),
        const Text(
          'Branş ve ders birbirinden bağımsızdır.',
          style: TextStyle(color: muted, fontSize: 12),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: line),
            borderRadius: BorderRadius.circular(13),
          ),
          child: Column(
            children: courses
                .map(
                  (x) => ListTile(
                    title: Text(
                      x,
                      style: const TextStyle(
                        color: navy,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    trailing: x == 'Fen Bilimleri'
                        ? const Icon(Icons.check_circle, color: mint)
                        : const Icon(Icons.drag_handle, color: muted),
                  ),
                )
                .toList(),
          ),
        ),
        const SizedBox(height: 18),
        FilledButton(
          onPressed: () => ScaffoldMessenger.of(
            c,
          ).showSnackBar(const SnackBar(content: Text('Ayarlar kaydedildi.'))),
          child: const Text('Değişiklikleri Kaydet'),
        ),
      ],
    ),
  );

  Future<void> _addCourse(BuildContext context) async {
    final controller = TextEditingController();
    final course = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Yeni ders ekle'),
        content: TextField(
          controller: controller,
          autofocus: true,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(labelText: 'Ders adı'),
          onSubmitted: (value) {
            if (value.trim().isNotEmpty) {
              Navigator.pop(dialogContext, value.trim());
            }
          },
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Vazgeç'),
          ),
          FilledButton(
            onPressed: () {
              if (controller.text.trim().isNotEmpty) {
                Navigator.pop(dialogContext, controller.text.trim());
              }
            },
            child: const Text('Ekle'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (course != null && mounted && !courses.contains(course)) {
      setState(() => courses.add(course));
    }
  }
}
