# Marktanalyse-Erweiterung

Einmal in Chrome oder Edge installieren. Danach einen mobile.de-Link in die Marktanalyse einfügen und **Prüfen** klicken. Unter **Ankauf bestätigen** den Link einfügen und **Daten laden** klicken, um das Fahrzeugformular auszufüllen.

## Installation

1. ZIP entpacken.
2. In Chrome `chrome://extensions` öffnen, in Edge `edge://extensions`.
3. **Entwicklermodus** aktivieren, **Entpackte Erweiterung laden** wählen und den entpackten Ordner mit der `manifest.json` auswählen.
4. Die Marktanalyse im Browser neu laden. Dort erscheint **mobile.de-Erweiterung verbunden**.

Die installierte App (eigenes Fenster) nutzt die Erweiterungen des Browsers, aus dem sie installiert wurde. Läuft die App in Edge, die Erweiterung also in Edge laden (`edge://extensions`), läuft sie in Chrome, in Chrome. Den Anzeigen-Tab öffnet die Erweiterung dann in einem normalen Browserfenster und holt es nach vorne, falls mobile.de eine Bestätigung braucht.

Die Erweiterung öffnet die Anzeige in einem eigenen Browser-Tab. Falls mobile.de eine Bestätigung braucht, wird dieser Tab angezeigt. Nach erfolgreichem Import startet die Analyse oder das Fahrzeugformular wird ausgefüllt.

Für die Marktanalyse wird zusätzlich eine Suchergebnisseite gelesen. Bis zu fünf passende mobile.de-Angebote fließen zusammen mit den übrigen Quellen in die Bewertung ein. Bei einer Zugriffssperre läuft die Analyse mit den übrigen Portalen weiter.

Unterstützte Marktanalyse-Adressen sind die Domains autogaleriejülich.de und autogalerie-juelich.de (jeweils auch www) sowie localhost und 127.0.0.1 für lokale Entwicklung.

Die Erweiterung benötigt Zugriff auf mobile.de und einen Connector auf den genannten Marktanalyse-Seiten. Die App überträgt die eingelesene Anzeige und gegebenenfalls die Suchtreffer an ihren bestehenden Server.

Für das Update die neue ZIP in den bereits geladenen Erweiterungsordner entpacken und die Dateien ersetzen. Dann in der Erweiterungsverwaltung bei der Erweiterung auf **Neu laden** klicken und die App-Seite aktualisieren.
