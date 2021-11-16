// initialization of page related code
window.pageisready = true;

const State = {
  ACTIVE: 'active',
  ERROR: 'is-invalid',
  HOVERING: 'is-hovering',
  HIDDEN: 'd-none',
  SHOW: 'show',
  FADE: 'fade',
};

class Tools {
  static scrollIntoView(element) {
    if (element) {
      const headerOffset = document.querySelector('header').offsetHeight + 40;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition - headerOffset + window.scrollY;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'auto',
      });
    }
  }
}

var header = document.querySelector('.header');
var headerMode = false;
var dropdownMode = false;
var isMegaMenuOpen = false;
var isLanguageDropdownOpen = false;

var handleClickOutside = function (selector, callback, event) {
  var target = event.target;

  if (target !== document.querySelector(selector)) {
    callback(event);
  }
};

var isVisible = function (element) {
  var style = window.getComputedStyle(element);

  if (style.display !== 'none') {
    return true;
  }

  return false;
};

var isOpen = function (selector) {
  var open = false;

  [].forEach.call(document.querySelectorAll(selector), function (element) {
    if (isVisible(element)) {
      open = true;

      return;
    }
  });

  return open;
};

var handleHeaderHover = function (e) {
  if (e.type === 'mouseover') {
    header.classList.add('is-hovering');
  } else if (!isMegaMenuOpen) {
    header.classList.remove('is-hovering');
  }
};

var handleDelayedHeaderClick = function (e) {
  setTimeout(function () {
    if (!dropdownMode) {
      dropdownMode = true;
      handleHeaderClick(e);
    } else {
      dropdownMode = false;
      resetHeaderState();
    }
  }, 150);
};

var handleHeaderClick = function (e) {
  if (isMegaMenuOpen || isLanguageDropdownOpen) {
    header.classList.add('is-open');
    headerMode = true;
  } else {
    resetHeaderState();
  }
};

var resetHeaderState = function () {
  headerMode = false;
  header.classList.remove('is-open');
  header.classList.remove('is-hovering');
};

var handleHeaderOutsideClick = function () {
  if (headerMode) {
    handleHeaderClick();
  }
};

var handleMegaMenuMutation = function (event) {
  for (let i = 0; i < event.length; i++) {
    var mutationRecord = event[i];

    if (mutationRecord.attributeName === 'style') {
      isMegaMenuOpen = isOpen('.hs-mega-menu');

      handleHeaderClick();
    }
  }
};

var handleLanguageDropdownMutation = function (event) {
  for (let i = 0; i < event.length; i++) {
    var mutationRecord = event[i];

    if (mutationRecord.attributeName === 'class') {
      isLanguageDropdownOpen = !mutationRecord.target.classList.contains('hs-unfold-hidden');

      handleHeaderClick();
    }
  }
};

var addMutationObserver = function (element, callback) {
  var config = { attributes: true, childList: true, subtree: true };
  var observer = new MutationObserver(callback);

  observer.observe(element, config);
};

var bindListeners = function () {
  [].forEach.call(document.querySelectorAll('.header'), function (element) {
    element.addEventListener('mouseover', handleHeaderHover);
    element.addEventListener('mouseout', handleHeaderHover);
  });

  document.addEventListener('click', handleClickOutside.bind(this, '.header', handleHeaderOutsideClick));

  [].forEach.call(document.querySelectorAll('.hs-mega-menu'), function (element) {
    addMutationObserver(element, handleMegaMenuMutation);
  });

  [].forEach.call(document.querySelectorAll('.header .hs-unfold-content.dropdown-menu'), function (element) {
    addMutationObserver(element, handleLanguageDropdownMutation);
  });
};

class TagFilter {
  static rootSelector = '.tags';
  static instances = [];

  constructor(root) {
    this.root = root;
    this.paramName = 'tag';
    this.postTeaserSelector = '.post-teaser';
    this.dataTagsSelector = '[data-tags]';
    this.buttonSelector = '.tags__btn';
    this.containerSelector = '.tags__container';
    this.clearSelector = '.tags__clear';

    if (this.hasParam()) {
      this.setActive();
    }

    this.bindEvents();
  }

  isOverviewPage() {
    return !document.location.href.includes('tags');
  }

  bindEvents() {
    [].forEach.call(this.root.querySelectorAll(this.buttonSelector), (element) => {
      element.addEventListener('click', this.handleClick.bind(this));
    });

    if (!this.isOverviewPage()) {
      this.root.querySelector(this.clearSelector)?.addEventListener('click', this.handleCloseClick.bind(this));
    }
  }

  handleCloseClick(e) {
    e.preventDefault();

    this.enableLoading().then((container) => {
      this.hideClear();
      this.showAllDataTags();
      this.resetTags();
      this.removeParam();
      this.disableLoading(container);
    });
  }

  handleClick(e) {
    if (!this.isOverviewPage()) {
      e.preventDefault();

      const current = e.currentTarget;

      this.enableLoading().then((container) => {
        const tag = current.dataset?.text;

        this.setParam(tag);
        this.setActive(tag);
        this.disableLoading(container);
      });
    }
  }

  disableLoading(container) {
    container.classList.add(State.SHOW);
    container.classList.remove(State.FADE);
    container.classList.remove(State.SHOW);
  }

  enableLoading() {
    return new Promise((resolve) => {
      const container = document.querySelector(this.containerSelector);

      container.classList.add(State.FADE);
      container.ontransitionend = () => {
        resolve(container);
      };
    });
  }

  removeParam() {
    const url = new URL(document.location.href);

    url.searchParams.delete(this.paramName);

    window.history.pushState({}, '', url);
  }

  setParam(param) {
    const url = new URL(document.location.href);

    url.searchParams.set(this.paramName, param);

    window.history.pushState({}, '', url);
  }

  getParam() {
    const url = new URLSearchParams(document.location.search);

    return url.get(this.paramName);
  }

  hasParam() {
    return this.getParam() ? true : false;
  }

  setActive(newTag) {
    const tag = newTag || this.getParam();

    [].forEach.call(this.root.querySelectorAll('[data-text]'), function (element) {
      element.classList.remove(State.ACTIVE);
    });

    this.root.querySelector(`[data-text="${tag}"]`)?.classList.add(State.ACTIVE);
    this.filterByTag(tag);
    this.showClear();
  }

  showClear() {
    this.root.querySelector(this.clearSelector)?.classList.remove(State.HIDDEN);
  }

  hideClear() {
    this.root.querySelector(this.clearSelector)?.classList.add(State.HIDDEN);
  }

  filterByTag(tag) {
    this.hideAllDataTags();

    [].forEach.call(document.querySelectorAll(`[data-tags='${tag}']`), function (element) {
      element.classList.remove(State.HIDDEN);
    });
  }

  hideAllDataTags() {
    [].forEach.call(document.querySelectorAll(this.dataTagsSelector), function (element) {
      element.classList.add(State.HIDDEN);
    });
  }

  showAllDataTags() {
    [].forEach.call(document.querySelectorAll(this.dataTagsSelector), function (element) {
      element.classList.remove(State.HIDDEN);
    });
  }

  resetTags() {
    this.root.querySelector(`${this.buttonSelector}.${State.ACTIVE}`)?.classList.remove(State.ACTIVE);
  }

  static init() {
    this.instances = [];

    [].forEach.call(document.querySelectorAll(this.rootSelector), (element) => {
      this.instances.push(new this(element));
    });
  }
}

$(document).on('ready', function () {
  // initialization of header
  var header = new HSHeader($('#header')).init();

  // initialization of mega menu
  var megaMenu = new HSMegaMenu($('.js-mega-menu'), {
    eventType: 'click',
    desktop: {
      position: 'left',
    },
  }).init();

  TagFilter.init();

  bindListeners();

  // TODO find the reason why this happens (hotfix 1)
  // document.querySelectorAll('img[srcset]').forEach((img) => {
  //   img.srcset = decodeURI(img.srcset).replace(/, /g, ',');
  // });
});
