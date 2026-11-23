import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Blog: una entrada por archivo en src/content/blog/<slug>.mdx (el nombre del archivo es la URL).
 * Las fotos salen de los proyectos (por slug), así cada artículo enlaza a obra real del estudio.
 * En el cuerpo se pueden usar <Figura />, <Par />, <Obra /> y <Resumen /> sin importarlos.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    titulo: z.string(),
    /** Para <title> cuando el titular es largo. Google corta a ~60 caracteres */
    seoTitulo: z.string().max(60).optional(),
    /** Meta description: lo que se lee en Google bajo el título */
    descripcion: z.string().min(70).max(160),
    /** Entradilla visible bajo el titular (si falta, se usa la descripción) */
    entradilla: z.string().optional(),
    fecha: z.coerce.date(),
    actualizado: z.coerce.date().optional(),
    categoria: z.enum(['Comercio', 'Salud', 'Hostelería', 'Vivienda', 'Oficinas', 'Iluminación', 'Estudio']),
    portada: z.object({
      proyecto: z.string(),
      foto: z.number().int().min(0).default(0),
      alt: z.string(),
    }),
    /** Proyectos citados: se muestran al final y refuerzan el enlazado interno */
    proyectos: z.array(z.string()).default([]),
    autor: z.string().default('NAN Arquitectos'),
    borrador: z.boolean().default(false),
  }),
});

export const collections = { blog };
