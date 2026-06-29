import { LLMService } from "./llm.service";
import logger from "../utils/logger";
import { rssCache, summaryCache } from "../utils/cache";
import { stats } from "../utils/stats";

interface RssSource {
  id: string;
  name: string;
  url: string;
}

const RSS_FEEDS: Record<string, RssSource> = {
  elpais: {
    id: "elpais",
    name: "El País",
    url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/america/portada",
  },
  rt: {
    id: "rt",
    name: "RT (Russia Today)",
    url: "https://actualidad.rt.com/feeds/all.rss",
  },
  aporrea: {
    id: "aporrea",
    name: "Aporrea",
    url: "http://feeds.feedburner.com/aporrea/noticias",
  },
  dw: {
    id: "dw",
    name: "DW (Deutsche Welle)",
    url: "http://rss.dw.com/rdf/rss-sp-top",
  },
  lanacion: {
    id: "lanacion",
    name: "La Nación",
    url: "https://www.lanacion.com.ar/arc/outboundfeeds/rss/?outputType=xml",
  },
  nytimes: {
    id: "nytimes",
    name: "nytimes",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
  },
};

export class NewsService {
  public static async generateSummary(
    activeSources: string[],
    accountId: string,
  ): Promise<string> {
    const sourcesToProcess = activeSources
      .map((s) => s.toLowerCase())
      .includes("all")
      ? Object.keys(RSS_FEEDS)
      : activeSources;

    const sourcesToFetch = sourcesToProcess.filter((id) => RSS_FEEDS[id]);
    if (sourcesToFetch.length === 0) {
      throw new Error(
        "Debes seleccionar al menos una fuente de noticias activa.",
      );
    }

    logger.info(
      `[NEWS_SUMMARY] Generando resumen para cuenta ${accountId} desde fuentes: ${sourcesToFetch.join(", ")}...`,
    );

    const fetchPromises = sourcesToFetch.map((id) =>
      this.fetchAndParseRss(RSS_FEEDS[id]!),
    );
    const results = await Promise.all(fetchPromises);
    const consolidatedNews = results.join("\n---\n");

    if (!consolidatedNews.trim()) {
      logger.info(
        `[CACHE_SUMMARY] No se encontraron noticias para fuentes: ${sourcesToFetch.join(", ")}`,
      );
      return "No se encontraron noticias relevantes sobre Venezuela en las fuentes seleccionadas.";
    }

    const summaryCacheKey = `summary:${sourcesToFetch.slice().sort().join(",")}`;
    const cachedSummary = summaryCache.get<string>(summaryCacheKey);
    if (cachedSummary) {
      logger.info(
        `[CACHE_SUMMARY] Resumen cacheado encontrado para: ${summaryCacheKey}`,
      );
      stats.trackSummaryCacheHit();
      return cachedSummary;
    }

    logger.info(
      `[CACHE_SUMMARY] No hay resumen en cache. Consultando Gemini...`,
    );

    const systemPrompt = `
Eres un asistente editorial experto en síntesis informativa, análisis geopolítico y redacción periodística, especializado en el acontecer de Venezuela.
Tu objetivo es analizar el listado de noticias proporcionado y generar un **Resumen Informativo de Venezuela** consolidado, objetivo, claro y profesional.

Reglas estrictas del resumen:
1. **Filtro Temático Absoluto:** Concéntrate **única y exclusivamente** en noticias que ocurran en Venezuela o que tengan una relación directa con el país (ej: diplomacia, diáspora, ayuda internacional, etc.). Ignora por completo cualquier noticia internacional que no mencione o afecte directamente a Venezuela.
2. **Estructura y Organización:** Agrupa las noticias venezolanas en subtemas coherentes utilizando títulos limpios en Markdown (ej: # 🚨 Catástrofes y Emergencias, # 🏛️ Política y Gobierno, # 📉 Economía, etc.).
3. **Metadatos Obligatorios con Hipervínculos (Fuente, Enlace y Fecha):** Para cada hecho, noticia o viñeta resumida, es **estrictamente mandatorio** incluir la fuente original configurada como un enlace clicable de Markdown utilizando la dirección provista en la etiqueta [URL_ORIGINAL: ...], seguida de la fecha entre paréntesis al final de la línea.
   - *Ejemplo de formato:* "Este es el hecho noticioso resumido. (_[[El País](https://ejemplo.com/noticia), 28/06/2026]_)"
   - Si la fecha no está disponible en el texto, coloca solo el hipervínculo de la fuente: "(_[[RT](https://ejemplo.com/noticia)]_)"
   - Nunca dejes la URL plana expuesta; siempre camúflala dentro del nombre del medio de comunicación.
4. **Consolidación de Fuentes:** Evita duplicar noticias similares de distintas fuentes. Si varios medios reportan el mismo evento (ej: el doble sismo), unifica todos los datos en una sola crónica o viñeta fluida y cita todos los hipervínculos dentro del mismo paréntesis de metadatos (ej: "(_[[RT](url1) / [NY Times](url2), 28/06/2026]_ )").
5. **Tono y Estilo:** Mantén un tono neutro, analítico, riguroso y puramente periodístico. Estructura el boletín elegantemente utilizando Markdown (títulos, negritas y listas de viñetas).
`;

    const userMessage = `
A continuación tienes el boletín de noticias de hoy recopiladas de los RSS feeds activos:

${consolidatedNews}

Por favor, genera el resumen consolidado de hoy siguiendo las reglas especificadas.
`;

    stats.trackGeminiCall();
    const modelId = "google/gemini-2.5-pro";
    const aiRes = await LLMService.generateResponse(
      systemPrompt,
      [],
      userMessage,
      undefined,
      accountId,
      modelId,
    );

    const summary = aiRes.text || "No se pudo generar el resumen.";
    summaryCache.set(summaryCacheKey, summary);
    logger.info(
      `[CACHE_SUMMARY] Resumen guardado en cache con key: ${summaryCacheKey}`,
    );

    return summary;
  }

  private static async fetchAndParseRss(source: RssSource): Promise<string> {
    const cacheKey = `rss:${source.id}`;
    const cached = rssCache.get<string>(cacheKey);
    if (cached) {
      logger.info(`[CACHE_RSS] Fuente "${source.name}" servida desde cache`);
      stats.trackRssCacheHit();
      return cached;
    }

    const result = await this.fetchRawRss(source);
    rssCache.set(cacheKey, result);
    logger.info(`[CACHE_RSS] Fuente "${source.name}" guardada en cache`);
    return result;
  }

  private static async fetchRawRss(source: RssSource): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(source.url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return `### ${source.name}\nError: No se pudo conectar a la fuente (status ${res.status}).\n`;
      }

      const xml = await res.text();

      const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      if (itemMatches.length === 0) {
        const entryMatches = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
        if (entryMatches.length === 0) {
          return `### ${source.name}\nNo se encontraron noticias recientes.\n`;
        }
        return this.parseEntries(source.name, entryMatches.slice(0, 15));
      }

      return this.parseItems(source.name, itemMatches.slice(0, 15));
    } catch (error: any) {
      return `### ${source.name}\nError al recuperar noticias: ${error.message}\n`;
    }
  }

  private static cleanHtmlAndCdata(text: string): string {
    if (!text) return "";
    let cleaned = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
    cleaned = cleaned.replace(/<[^>]*>?/gm, "");
    return cleaned.replace(/\s+/g, " ").trim();
  }

  private static parseItems(sourceName: string, items: string[]): string {
    let output = `### ${sourceName}\n`;
    let newsFound = 0;

    items.forEach((item) => {
      const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
      const descMatch = item.match(/<description>([\s\S]*?)<\/description>/);

      const title = this.cleanHtmlAndCdata(titleMatch?.[1] ?? "Sin título");
      const link = linkMatch?.[1]?.trim() ?? "";
      const desc = this.cleanHtmlAndCdata(descMatch?.[1] ?? "").slice(0, 150);

      const keywords = [
        "venezuela",
        "caracas",
        "maduro",
        "chavismo",
        "maracaibo",
        "delcy",
      ];
      const textToSearch = `${title} ${desc}`.toLowerCase();
      const containsVenezuela = keywords.some((word) =>
        textToSearch.includes(word),
      );
      if (!containsVenezuela) return;

      newsFound++;
      output += `- **${title}**\n`;
      if (desc) output += `  _${desc}_\n`;
      if (link) output += `  [URL_ORIGINAL: ${link}]\n`;
      output += "\n";
    });

    return newsFound > 0 ? output : "";
  }

  private static parseEntries(sourceName: string, entries: string[]): string {
    let output = `### ${sourceName}\n`;
    let newsFound = 0;

    entries.forEach((entry) => {
      const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch =
        entry.match(/<link href="([\s\S]*?)"/) ||
        entry.match(/<link>([\s\S]*?)<\/link>/);
      const summaryMatch =
        entry.match(/<summary>([\s\S]*?)<\/summary>/) ||
        entry.match(/<content>([\s\S]*?)<\/content>/);

      const title = this.cleanHtmlAndCdata(titleMatch?.[1] ?? "Sin título");
      const link = linkMatch?.[1]?.trim() ?? "";
      const desc = this.cleanHtmlAndCdata(summaryMatch?.[1] ?? "").slice(
        0,
        150,
      );

      const keywords = [
        "venezuela",
        "caracas",
        "maduro",
        "chavismo",
        "maracaibo",
        "delcy",
      ];
      const textToSearch = `${title} ${desc}`.toLowerCase();
      const containsVenezuela = keywords.some((word) =>
        textToSearch.includes(word),
      );
      if (!containsVenezuela) return;

      newsFound++;
      output += `- **${title}**\n`;
      if (desc) output += `  _${desc}_\n`;
      if (link) output += `  [URL_ORIGINAL: ${link}]\n`;
      output += "\n";
    });

    return newsFound > 0 ? output : "";
  }
}
