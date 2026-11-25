(() => {
  const sections = [document.querySelector('.relay-header'), document.querySelector('main')];
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();
  const attributes = ['aria-label', 'title', 'placeholder'];
  let language = 'it';
  let dictionary = {};

  function translatedText(original, labels) {
    if (labels[original]) return labels[original];
    const patterns = [
      [/^Chiamata di (.+)$/, 'Chiamata di {value}', 'value'],
      [/^Chiamata da (.+)$/, 'Chiamata da {value}', 'value'],
      [/^(\d+) chiamata trovata$/, '{count} chiamata trovata', 'count'],
      [/^(\d+) chiamate trovate$/, '{count} chiamate trovate', 'count'],
      [/^Mostra tutti i messaggi \((\d+)\)$/, 'Mostra tutti i messaggi ({count})', 'count'],
    ];
    for (const [pattern, key, variable] of patterns) {
      const match = original.match(pattern);
      if (match && labels[key]) return labels[key].replace(`{${variable}}`, match[1]);
    }
    return original;
  }

  function translate() {
    sections.forEach(section => {
      const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.parentElement.closest('script, style, svg')) continue;
        const englishSection = node.parentElement.closest('[lang="en"]');
        if (englishSection && englishSection !== section && section.contains(englishSection)) continue;
        if (!originalText.has(node)) originalText.set(node, node.nodeValue);
        const original = originalText.get(node);
        const text = original.trim();
        const replacement = language === 'en' && text ? translatedText(text, dictionary) : text;
        const value = text ? original.replace(text, replacement) : original;
        if (node.nodeValue !== value) node.nodeValue = value;
      }
      section.querySelectorAll('[aria-label], [title], [placeholder]').forEach(element => {
        if (!originalAttributes.has(element)) originalAttributes.set(element, {});
        const originals = originalAttributes.get(element);
        attributes.forEach(attribute => {
          if (!element.hasAttribute(attribute)) return;
          if (!(attribute in originals)) originals[attribute] = element.getAttribute(attribute);
          const original = originals[attribute];
          const value = language === 'en' ? translatedText(original, dictionary) : original;
          if (element.getAttribute(attribute) !== value) element.setAttribute(attribute, value);
        });
      });
      section.lang = language;
    });
  }

  document.addEventListener('tetravise:language', event => {
    language = event.detail.language;
    dictionary = event.detail.labels['relay.text'] || {};
    if (event.detail.labels['relay.title']) document.title = event.detail.labels['relay.title'];
    translate();
  });
  const observer = new MutationObserver(translate);
  sections.forEach(section => observer.observe(section, { childList: true, subtree: true }));
})();