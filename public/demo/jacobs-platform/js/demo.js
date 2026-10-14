/* demo.js: the workforce views are not part of the synthetic demo. Their routes
   stay reachable by hash, so each renders a short notice instead of an empty page. */
(function () {
  var ids = ['cert-overview', 'cert-actions', 'cert-contractors', 'cert-workers', 'training',
    'bidders', 'bidder-critical', 'bidder-packages', 'bidder-owners', 'bidder-progress',
    'hours-overview', 'hours-week', 'hours-month', 'hours-worker', 'hours-companies',
    'hours-burndown', 'jha'];
  window.Pages = window.Pages || {};
  ids.forEach(function (id) {
    window.Pages[id] = function () {
      return '<div class="card" style="padding:24px"><h3 style="margin:0 0 8px">Not included in the demo</h3>' +
        '<p style="margin:0">This view reads workforce trackers that are not part of the synthetic demo data. ' +
        '<a href="#/overview">Back to the Command Center</a></p></div>';
    };
  });
})();
