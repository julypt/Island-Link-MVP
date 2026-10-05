(() => {
  const navigation = document.querySelector(".primary-nav");
  if (!navigation) return;

  function updateCurrentTab() {
    const selectedTab = window.location.hash.slice(1);
    if (!selectedTab) return;

    const selectedLink = [...navigation.querySelectorAll("[data-tab]")]
      .find(link => link.dataset.tab === selectedTab);
    if (!selectedLink) return;

    navigation.querySelectorAll("[data-tab]").forEach(link => {
      if (link === selectedLink) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  updateCurrentTab();
  window.addEventListener("hashchange", updateCurrentTab);
})();