/** Antepone la ruta base (astro.config `base`) a un enlace interno: r('/proyectos/') → '/nanarquitectura/proyectos/' */
export const r = (path: string) => import.meta.env.BASE_URL.replace(/\/$/, '') + path;
