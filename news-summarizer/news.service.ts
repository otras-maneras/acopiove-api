import fetch from 'node-fetch';
import { LLMService } from './llm.service.ts'; // Adaptar al cliente de IA correspondiente
import logger from '../utils/logger.ts';     // Adaptar al logger del proyecto correspondiente

interface RssSource {
  id: string;
  name: string;
  url: string;
}

const RSS_FEEDS: Record<string, RssSource> = {
  elpais: {
    id: 'elpais',
    name: 'El País',
    url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/america/portada'
  },
  rt: {
    id: 'rt',
    name: 'RT (Russia Today)',
    url: 'https://actualidad.rt.com/feeds/all.rss'
  },
  aporrea: {
    id: 'aporrea',
    name: 'Aporrea',
    url: 'http://feeds.feedburner.com/aporrea/noticias'
  },
  dw: {
    id: 'dw',
    name: 'DW (Deutsche Welle)',
    url: 'http://rss.dw.com/rdf/rss-sp-top'
  },
  lanacion: {
    id: 'lanacion',
    name: 'La Nación',
    url: 'https://www.lanacion.com.ar/arc/outboundfeeds/rss/?outputType=xml'
  },
  nytimes: {
    id: 'nytimes',
    name: 'NY Times (World)',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml'
  }
};

export class NewsService {
  /**
   * Genera un resumen de noticias consolidado a partir de fuentes seleccionadas usando Gemini.
   * 
   * @param activeSources IDs de las fuentes a consultar (ej: ['elpais', 'dw'])
   * @param accountId ID de cuenta o tracking para control de cuotas/logs
   * @returns Resumen en formato Markdown
   */
  public static async generateSummary(
    activeSources: string[],
    accountId: string
  ): Promise<string> {
    const sourcesToFetch = activeSources.filter(id => RSS_FEEDS[id]);
    if (sourcesToFetch.length === 0) {
      throw new Error('Debes seleccionar al menos una fuente de noticias activa.');
    }

    logger.info(`[NEWS_SUMMARY] Generando resumen para cuenta ${accountId} desde fuentes: ${sourcesToFetch.join(', ')}...`);

    // Fetch y parsear todas las fuentes en paralelo
    const fetchPromises = sourcesToFetch.map(id => this.fetchAndParseRss(RSS_FEEDS[id]));
    const results = await Promise.all(fetchPromises);
    const consolidatedNews = results.join('\n---\n');

    // Prompt del sistema para el LLM
    const systemPrompt = `
Eres un asistente editorial experto en síntesis informativa y redacción periodística.
Tu objetivo es analizar el siguiente listado de noticias recientes recopiladas de diversas fuentes de prensa y generar un **Resumen Informativo Diario** consolidado, objetivo, claro y profesional.

Reglas del resumen:
1. Agrupa las noticias en temas principales coherentes (ej: Política Internacional, Economía, Ciencia y Tecnología, etc.).
2. Para cada tema, redacta un párrafo de síntesis o una lista de viñetas claras que resuman los eventos más importantes.
3. Cita las fuentes originales de información cuando sea pertinente (ej: "Según informa El País...", "Reportes de DW indican...").
4. Mantén un tono neutro y periodístico.
5. El resumen debe estar estructurado de forma elegante utilizando Markdown (títulos, negritas, listas).
6. Evita duplicar noticias similares de distintas fuentes; consolídalas en un solo hecho explicativo.
`;

    const userMessage = `
A continuación tienes el boletín de noticias de hoy recopiladas de los RSS feeds activos:

${consolidatedNews}

Por favor, genera el resumen consolidado de hoy siguiendo las reglas especificadas.
`;

    // Llamar a Gemini (Gemini 2.5 Pro es excelente para síntesis o en su defecto el modelo primario)
    const modelId = 'google/gemini-2.5-pro'; // Modelo premium ideal para razonamiento y redacción
    const aiRes = await LLMService.generateResponse(
      systemPrompt,
      [],
      userMessage,
      undefined,
      accountId,
      modelId
    );

    return aiRes.text || 'No se pudo generar el resumen.';
  }

  private static async fetchAndParseRss(source: RssSource): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const res = await fetch(source.url, {
        signal: controller.signal as any,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
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
        return this.parseEntries(source.name, entryMatches.slice(0, 5));
      }

      return this.parseItems(source.name, itemMatches.slice(0, 5));
    } catch (error: any) {
      return `### ${source.name}\nError al recuperar noticias: ${error.message}\n`;
    }
  }

  private static cleanHtmlAndCdata(text: string): string {
    if (!text) return '';
    let cleaned = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
    cleaned = cleaned.replace(/<[^>]*>?/gm, '');
    return cleaned.replace(/\s+/g, ' ').trim();
  }

  private static parseItems(sourceName: string, items: string[]): string {
    let output = `### ${sourceName}\n`;
    
    items.forEach(item => {
      const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
      const descMatch = item.match(/<description>([\s\S]*?)<\/description>/);
      
      const title = this.cleanHtmlAndCdata(titleMatch ? titleMatch[1] : 'Sin título');
      const link = linkMatch ? linkMatch[1].trim() : '';
      const desc = this.cleanHtmlAndCdata(descMatch ? descMatch[1] : '').slice(0, 150);
      
      output += `- **${title}**\n`;
      if (desc) output += `  _${desc}_\n`;
      if (link) output += `  [Leer más](${link})\n`;
      output += '\n';
    });
    
    return output;
  }

  private static parseEntries(sourceName: string, entries: string[]): string {
    let output = `### ${sourceName}\n`;
    
    entries.forEach(entry => {
      const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = entry.match(/<link href="([\s\S]*?)"/) || entry.match(/<link>([\s\S]*?)<\/link>/);
      const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/) || entry.match(/<content>([\s\S]*?)<\/content>/);
      
      const title = this.cleanHtmlAndCdata(titleMatch ? titleMatch[1] : 'Sin título');
      const link = linkMatch ? linkMatch[1].trim() : '';
      const desc = this.cleanHtmlAndCdata(summaryMatch ? summaryMatch[1] : '').slice(0, 150);
      
      output += `- **${title}**\n`;
      if (desc) output += `  _${desc}_\n`;
      if (link) output += `  [Leer más](${link})\n`;
      output += '\n';
    });
    
    return output;
  }
}
