# Helfer (Browser-Erweiterung)

Liest Seiten von **mobile.de, AutoScout24 und Kleinanzeigen** im eigenen Browser ein und gibt sie an die App weiter:

- **Marktanalyse**: die Anzeige des Fahrzeugs und die Suchergebnisse mit vergleichbaren Fahrzeugen.
- **Posteingang → Ankauf → Ankauf bestätigen**: eine mobile.de-Anzeige, um das Fahrzeugformular auszufüllen.

Die Portale blockieren Abfragen von Servern. Deshalb öffnet die Erweiterung die Seiten in eigenen Tabs des Browsers, wartet, bis sie geladen sind, und schließt die Tabs wieder. Das Auslesen der Daten macht die App – die Erweiterung liefert nur die Seiten.

## Installation

1. ZIP (Einstellungen → Browser-Erweiterung → Herunterladen) entpacken.
2. In Chrome `chrome://extensions` öffnen, in Edge `edge://extensions`.
3. **Entwicklermodus** aktivieren, **Entpackte Erweiterung laden** wählen und den entpackten Ordner mit der `manifest.json` auswählen.
4. Die App-Seite neu laden. In den Einstellungen erscheint **Verbunden**.

Die installierte App (eigenes Fenster) nutzt die Erweiterungen des Browsers, aus dem sie installiert wurde. Läuft die App in Edge, die Erweiterung also in Edge laden, läuft sie in Chrome, in Chrome.

## Benutzung

**Marktanalyse:** Link einer Anzeige einfügen und **Analysieren** klicken. Die Erweiterung öffnet nacheinander die Anzeige und einige Suchseiten im Hintergrund – je Portal eine Seite nach der anderen, mit kurzer Pause. Der Fortschritt steht auf der Seite.

**Ankauf bestätigen:** einen mobile.de-Link einfügen und **Daten laden** klicken.

**Sicherheitsabfrage:** Verlangt ein Portal eine Bestätigung („Bist du ein Mensch?“), holt die Erweiterung diesen Tab nach vorne. Die Bestätigung selbst erledigen; danach geht es von allein weiter. Die Erweiterung beantwortet solche Abfragen nie selbst.

## Berechtigungen

- Zugriff auf `mobile.de`, `autoscout24.de` und `kleinanzeigen.de`, um die geöffneten Seiten zu lesen.
- Ein Connector auf den App-Seiten (autogaleriejülich.de, autogalerie-juelich.de, jeweils auch www, sowie localhost und 127.0.0.1 für lokale Entwicklung). Er antwortet nur auf **Marktanalyse**, **Ankauf bestätigen** und auf die Verbindungsprüfung in den **Einstellungen**.

## Update

Die neue ZIP in den geladenen Erweiterungsordner entpacken und die Dateien ersetzen. Dann in der Erweiterungsverwaltung bei der Erweiterung auf **Neu laden** klicken und die App-Seite aktualisieren.

## Version 3

Version 3 ersetzt Version 2 (nur mobile.de, nur „Ankauf bestätigen“). Die App erkennt nur noch Version 3; die alte Version bitte durch die neue ersetzen.
