/**
 * youtube-injector.js — Runtime injeção de YouTube nos módulos
 *
 * Cada HTML do curso inclui esse script. Ele:
 * 1. Detecta o número do módulo pelo nome do arquivo
 * 2. Busca videos.json no mesmo folder
 * 3. Se tem URL pro módulo → cria iframe + injeta no topo do <main>
 *
 * Funciona em qualquer HTML do curso sem precisar mexer no HTML.
 */
(function() {
  // 1. Detecta número do módulo
  const fname = window.location.pathname.split('/').pop() || '';
  const match = fname.match(/^(\d{2})-/);
  if (!match) return; // não é página de módulo
  const moduleNum = match[1];

  // 2. Extrai ID do YouTube
  function ytId(url) {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  // 3. Busca videos.json e injeta
  fetch('videos.json', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : {})
    .then(videos => {
      const url = videos[moduleNum] || '';
      const id = ytId(url);
      if (!id) return;

      // Cria slot
      const slot = document.createElement('div');
      slot.className = 'mb-8';
      slot.innerHTML = `
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div class="px-5 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <p class="text-xs text-purple-600 font-bold tracking-wider">🎥 VÍDEO — Módulo ${moduleNum}</p>
          </div>
          <div class="aspect-video bg-black">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/${id}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        </div>
      `;

      // Injeta no início do <main>
      const main = document.querySelector('main');
      if (main && main.firstChild) {
        // Insere DEPOIS do primeiro div (que costuma ser o título do módulo) pra não quebrar visual
        const titleBlock = main.querySelector('.mb-12') || main.firstChild;
        titleBlock.parentNode.insertBefore(slot, titleBlock.nextSibling);
      } else if (main) {
        main.insertBefore(slot, main.firstChild);
      }
    })
    .catch(() => {/* silencioso — vídeo é opcional */});
})();
