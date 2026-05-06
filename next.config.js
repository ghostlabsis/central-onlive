/** @type {import('next').NextConfig} */
const nextConfig = {
  // HTMLs gerados em public/[selliver]/[date]/ são servidos automaticamente
  // pelo Next.js (qualquer arquivo em public/ é servido como estático).
  // Ex: cursos.onlive.com.br/kamille/2026-05-12/00-INDICE.html
  reactStrictMode: true,
};

module.exports = nextConfig;
