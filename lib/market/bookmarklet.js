/**
 * Ein-Klick-Import — the dependable route for mobile.de.
 *
 * mobile.de refuses ad pages to servers, but not to people. The buyer already
 * has the ad open in his own browser, so a bookmark in his bookmarks bar reads
 * that page and hands it to the Ankaufs-Check in a new tab. No request goes
 * from our server to the portal; the page the portal sent him is the page we
 * analyse. It works the same on AutoScout24 and Kleinanzeigen.
 *
 * Transport: the page is gzip-compressed in the browser and passed in the URL
 * fragment (`#import=…`). A fragment never leaves the browser — it is not sent
 * to any server and does not appear in logs — and it needs no cooperation from
 * the portal page: no messaging between windows, nothing its security headers
 * could block. A typical ad page compresses to 100–300 KB, well inside what
 * browsers accept in a URL.
 *
 * Pure and dependency-free: used by the page to build the button and to read
 * what arrives.
 */

export const IMPORT_PREFIX = "#import=";
export const IMPORT_VERSION = 1;

/**
 * The code that runs on the portal page when the bookmark is clicked.
 * Kept as a string: it must survive being stored as a bookmark, and a function
 * turned into a string after the build would carry the bundler's renamings.
 */
const PAGE_SCRIPT = String.raw`(async()=>{
const APP=__APP__;
const w=window.open("about:blank","_blank");
try{
if(!/(^|\.)(mobile\.de|autoscout24\.[a-z]{2,3}|kleinanzeigen\.de)$/.test(location.hostname))throw new Error("Bitte auf einer Fahrzeuganzeige von mobile.de, AutoScout24 oder Kleinanzeigen klicken.");
if(typeof CompressionStream!=="function")throw new Error("Dieser Browser ist zu alt – bitte Chrome, Edge oder Firefox aktualisieren.");
const d=document.documentElement.cloneNode(true);
d.querySelectorAll("style,svg,link,noscript,iframe,video,audio,source,template,script[src]").forEach(e=>e.remove());
const p=JSON.stringify({v:${IMPORT_VERSION},u:location.href,h:d.outerHTML});
const s=new Blob([p]).stream().pipeThrough(new CompressionStream("gzip"));
const b=new Uint8Array(await new Response(s).arrayBuffer());
let t="";for(let i=0;i<b.length;i+=32768)t+=String.fromCharCode.apply(null,b.subarray(i,i+32768));
const z=btoa(t).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
if(!w)throw new Error("Das neue Fenster wurde blockiert – bitte Pop-ups für diese Seite erlauben und erneut klicken.");
w.opener=null;
w.location.href=APP+"/marktanalyse${IMPORT_PREFIX}"+z;
}catch(e){if(w)w.close();alert("Ankaufs-Check: "+e.message);}
})();`;

/** The bookmark's address, for an app running at `origin`. */
export function bookmarkletHref(origin) {
  const code = PAGE_SCRIPT.replace("__APP__", JSON.stringify(String(origin || "")))
    .split("\n")
    .join("");
  // Browsers percent-decode a javascript: address before running it, so the
  // encoded form is safe to store, drag and copy.
  return `javascript:${encodeURIComponent(code)}`;
}

function base64UrlToBytes(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

/**
 * Reads what the bookmark sent.
 * @param {string} fragment  location.hash, e.g. "#import=H4sIA…"
 * @returns {Promise<{url:string, html:string}>}
 */
export async function decodeImport(fragment) {
  const encoded = String(fragment || "").startsWith(IMPORT_PREFIX)
    ? String(fragment).slice(IMPORT_PREFIX.length)
    : "";
  if (!encoded) throw new Error("Es wurde keine Anzeige übertragen.");

  if (typeof DecompressionStream !== "function") {
    throw new Error("Dieser Browser kann die übertragene Anzeige nicht entpacken – bitte aktualisieren.");
  }

  const stream = new Blob([base64UrlToBytes(encoded)])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));
  const text = await new Response(stream).text();

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("Die übertragene Anzeige ist unvollständig angekommen.");
  }

  if (
    payload?.v !== IMPORT_VERSION ||
    typeof payload.u !== "string" ||
    typeof payload.h !== "string"
  ) {
    throw new Error("Die übertragene Anzeige hat ein unbekanntes Format.");
  }

  return { url: payload.u, html: payload.h };
}
