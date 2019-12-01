import $ from 'jquery';
import navigator from './navigator/Navigator';
import pageBanner from '../components/PageBanner/PageBanner';

$(() => {
  pageBanner.initialize();
  navigator.initialize();
});
