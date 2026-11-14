# Autogalerie Jülich – Helfer (Browser-Erweiterung)

Liest eine mobile.de-Anzeige im eigenen Browser ein, damit **Posteingang → Ankauf → Ankauf bestätigen** das Fahrzeugformular ausfüllen kann. mobile.de blockiert Abfragen vom Server, deshalb öffnet die Erweiterung die Anzeige in einem eigenen Tab des Browsers und gibt die Seite an die App weiter.

## Installation

1. ZIP (Einstellungen → Browser-Erweiterung → Herunterladen) entpacken.
2. In Chrome `chrome://extensions` öffnen, in Edge `edge://extensions`.
3. **Entwicklermodus** aktivieren, **Entpackte Erweiterung laden** wählen und den entpackten Ordner mit der `manifest.json` auswählen.
4. Die App-Seite neu laden. In den Einstellungen erscheint **Verbunden**.

Die installierte App (eigenes Fenster) nutzt die Erweiterungen des Browsers, aus dem sie installiert wurde. Läuft die App in Edge, die Erweiterung also in Edge laden, läuft sie in Chrome, in Chrome.

## Benutzung

Unter **Ankauf bestätigen** einen mobile.de-Link einfügen und **Daten laden** klicken. Die Erweiterung öffnet die Anzeige in einem Tab. Falls mobile.de eine Bestätigung braucht, wird dieser Tab nach vorne geholt. Nach dem Einlesen schließt sich der Tab und das Formular wird ausgefüllt.

## Berechtigungen

- Zugriff auf `mobile.de`, um die Anzeige zu lesen.
- Ein Connector auf den App-Seiten (autogaleriejülich.de, autogalerie-juelich.de, jeweils auch www, sowie localhost und 127.0.0.1 für lokale Entwicklung). Er antwortet nur auf **Ankauf bestätigen** und auf die Verbindungsprüfung in den **Einstellungen**.

## Update

Die neue ZIP in den geladenen Erweiterungsordner entpacken und die Dateien ersetzen. Dann in der Erweiterungsverwaltung bei der Erweiterung auf **Neu laden** klicken und die App-Seite aktualisieren.

## Ersetzt die alte „Marktanalyse“-Erweiterung

Diese Erweiterung ersetzt „Autogalerie Jülich – Marktanalyse“. Die alte Erweiterung bitte entfernen; sie wird von der App nicht mehr erkannt.
