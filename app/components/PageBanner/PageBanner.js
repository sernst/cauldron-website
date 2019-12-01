import $ from 'jquery';

function initialize() {
  $('.PageBanner__toggleMenuBtn').click(
    () => $('.PageBannerMenuDropdown').toggle()
  );
}

export default { initialize };
