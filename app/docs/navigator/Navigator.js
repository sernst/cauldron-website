import $ from 'jquery';

function initialize() {
  $('.NavigatorBrowseBtn').click(() => {
    $('.NavigatorBrowseBtn').hide();
    $('.NavigatorHideBtn').show();
    $('.NavigatorMobileSection').show();
    $('.NavigatorArea__mobileTitle').show();
  });

  $('.NavigatorHideBtn').click(() => {
    $('.NavigatorHideBtn').hide();
    $('.NavigatorBrowseBtn').show();
    $('.NavigatorMobileSection').hide();
    $('.NavigatorArea__mobileTitle').hide();
  });
}

export default { initialize };
