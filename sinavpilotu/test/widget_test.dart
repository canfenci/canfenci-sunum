import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sinavpilotu/main.dart';

void main() {
  Future<void> phone(WidgetTester tester, Widget widget) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(widget);
    await tester.pumpAndSettle();
  }

  testWidgets('Ana sınav aksiyonlarını gösterir', (tester) async {
    await phone(tester, const App());
    expect(find.text('Açık Uçlu Sınav'), findsOneWidget);
    expect(find.text('Çoktan Seçmeli Test'), findsOneWidget);
    expect(find.text('Ana Sayfa'), findsOneWidget);
  });

  testWidgets('Açık uçlu sınav başlangıç yöntemleri çalışır', (tester) async {
    await phone(tester, const App());
    await tester.tap(find.text('Açık Uçlu Sınav'));
    await tester.pumpAndSettle();
    expect(find.text('Cevap Anahtarını Tara'), findsOneWidget);
    expect(find.text('Sistem Üzerinden Oluştur'), findsOneWidget);
    await tester.tap(find.text('Sistem Üzerinden Oluştur'));
    await tester.pumpAndSettle();
    expect(find.text('Soru 1'), findsWidgets);
    expect(find.text('Öğrencileri Taramaya Geç'), findsNothing);
  });

  testWidgets('Sınıf ve öğrenci seçimi taramaya bağlanır', (tester) async {
    await phone(tester, const MaterialApp(home: ScanSetup()));
    expect(find.text('Hangi sınıfı tarıyorsunuz?'), findsOneWidget);
    expect(find.text('Berk Kaya'), findsOneWidget);
    await tester.tap(find.text('Ceren Ak'));
    await tester.pump();
    expect(find.text('Ceren Ak için Taramayı Başlat'), findsOneWidget);
  });

  testWidgets('AI puan önerisi öğrenci lehine yuvarlanır', (tester) async {
    await phone(tester, const MaterialApp(home: Review()));
    expect(find.text('6,6 → 7 · öğrenci lehine yuvarlandı'), findsOneWidget);
    expect(find.text('Onayla ve Sonraki'), findsOneWidget);
    await tester.tap(find.text('Değiştir'));
    await tester.pump();
    expect(find.text('Kaydet ve Sonraki'), findsOneWidget);
  });
}
