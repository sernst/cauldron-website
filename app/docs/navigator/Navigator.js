import $ from 'jquery';

function initialize() {
  $('.NavigatorBrowseBtn').click(() => {
    $('.NavigatorBrowseBtn').hide();
    $('.NavigatorHideBtn').show();
    $('.NavigatorMobileSection').show();
  });

  $('.NavigatorHideBtn').click(() => {
    $('.NavigatorHideBtn').hide();
    $('.NavigatorBrowseBtn').show();
    $('.NavigatorMobileSection').hide();
  });
}

export default { initialize };
