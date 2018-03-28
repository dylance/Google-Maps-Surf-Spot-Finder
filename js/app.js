var map;
var surfSpots = [
    {title: 'Pt Dume', location: {lat: 34.001201,lng: -118.806442}},
    {title: 'Leo Carillo', location: {lat: 34.044551,lng:-118.940695}},
    {title: 'County Line', location: {lat: 34.051425,lng: -118.95996}},
    {title: 'Malibu Pt', location: {lat: 34.036265 ,lng: -118.67795}},
    {title: 'Westward Beach', location: {lat: 34.008341 ,lng: -118.814812}}
]

function initMap() {
    //Constructor creates a new map - only center and zoom are required
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 34.001201, lng: -118.806442},
        zoom: 12,
        styles: [
            {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
            {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
            {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
            {
              featureType: 'administrative.locality',
              elementType: 'labels.text.fill',
              stylers: [{color: '#d59563'}]
            },
            {
              featureType: 'poi',
              elementType: 'labels.text.fill',
              stylers: [{color: '#d59563'}]
            },
            {
              featureType: 'poi.park',
              elementType: 'geometry',
              stylers: [{color: '#263c3f'}]
            },
            {
              featureType: 'poi.park',
              elementType: 'labels.text.fill',
              stylers: [{color: '#6b9a76'}]
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{color: '#38414e'}]
            },
            {
              featureType: 'road',
              elementType: 'geometry.stroke',
              stylers: [{color: '#212a37'}]
            },
            {
              featureType: 'road',
              elementType: 'labels.text.fill',
              stylers: [{color: '#9ca5b3'}]
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry',
              stylers: [{color: '#746855'}]
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry.stroke',
              stylers: [{color: '#1f2835'}]
            },
            {
              featureType: 'road.highway',
              elementType: 'labels.text.fill',
              stylers: [{color: '#f3d19c'}]
            },
            {
              featureType: 'transit',
              elementType: 'geometry',
              stylers: [{color: '#2f3948'}]
            },
            {
              featureType: 'transit.station',
              elementType: 'labels.text.fill',
              stylers: [{color: '#d59563'}]
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{color: '#17263c'}]
            },
            {
              featureType: 'water',
              elementType: 'labels.text.fill',
              stylers: [{color: '#515c6d'}]
            },
            {
              featureType: 'water',
              elementType: 'labels.text.stroke',
              stylers: [{color: '#17263c'}]
            }
        ],
        mapTypeControl: false
    });

    var largeInfowindow = new google.maps.InfoWindow();

    //var bounds = new google.maps.LatLngBounds();

    // document.getElementById('show-spots').addEventListener('click', showListings);
    // document.getElementById('hide-spots').addEventListener('click', hideListings);

    ko.applyBindings(new ViewModel())

}
    // map.fitBounds(bounds);
var surfSpot = function(data){
    this.name = data.title
    // TO DO: Add Images
    // this.imgSrc = ko.observableArray(data.imgSrc)
    // this.nickName = ko.observableArray(data.nickName)
    this.position = data.location

    this.display = ko.observable(true)

    // Style the markers a bit. This will be our listing marker icon.
    var defaultIcon = makeMarkerIcon('0091ff');
    // Create a "highlighted location" marker color for when the user
    // mouses over the marker.
    var highlightedIcon = makeMarkerIcon('FFFF24');

    this.marker = new google.maps.Marker({
            position: this.position,
            title: this.name,
            animation: google.maps.Animation.DROP,
            icon: defaultIcon,
    });
    //this.marker.addListener('click', function(){
    //        populateInfoWindow(this,largeInfowindow);
    //});

    // Two event listeners - one for mouseover, one for mouseout,
    // to change the colors back and forth.
    this.marker.addListener('mouseover', function() {
        this.setIcon(highlightedIcon);
    });

    this.marker.addListener('mouseout', function() {
        this.setIcon(defaultIcon);
    });
}

var ViewModel = function(){
    var self = this

    this.s = ko.observable('show spots!')
    this.d = ko.observable('hide spots!')
    this.filter =  ko.observable('')

    this.spotList = ko.observableArray([])

    surfSpots.forEach(function(spot){
        self.spotList.push(new surfSpot(spot))
    })

    this.showSpot = function(clickedSpot){
        clickedSpot.marker.setMap(map)
    }
    // This function will loop through the markers array and display them all.
    this.showListings = function(){
        var bounds = new google.maps.LatLngBounds();
        // Extend the boundaries of the map for each marker and display the marker
        self.spotList().forEach(function(spot){
            spot.marker.setMap(map)
            bounds.extend(spot.position);
        })
        map.fitBounds(bounds);
    }
    // This function will loop through the listings and hide them all.
    this.hideListings = function(){
        self.spotList().forEach(function(spot){
            spot.marker.setMap(null)
        })
    }

    this.filteredItems = ko.computed(function(){
        var filter2 = self.filter().toLowerCase();

        if (!filter2){
            return self.spotList()
        }
        else {
            return ko.utils.arrayFilter(self.spotList(), function(spot){
                if ( spot.name.toLowerCase().indexOf(filter2) >= 0) {
                    return true;
                }
                else {
                    return false;
                }
            })
        }
    })
}
// populates info window whem marker is clicked.
function populateInfoWindow(marker, infowindow){
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        infowindow.setContent('<div>' + marker.title + '</div>');
        infowindow.open(map, marker);
        // clear marker property if info window closed
        infowindow.addListener('closeclick', function(){
            infowindow.setMarker(null);
        });
        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;
        // In case the status is OK, which means the pano was found, compute the
        // position of the streetview image, then calculate the heading, then get a
        // panorama from that and set the options
        function getStreetView(data, status){
            if ( status == google.maps.StreetViewStatus.OK){
            var nearStreetViewLocation = data.location.latLng;
            var heading = google.maps.geometry.spherical.computeHeading(
                nearStreetViewLocation, marker.position);
                infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
                var panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: -30
                    }
                };
            var panorama = new google.maps.StreetViewPanorama(
                document.getElementById('pano'), panoramaOptions);
            }
            else {
                infowindow.setContent('<div>No Street View Found</div>');
            }
        }
        // use street to get cloest streetview image within
        // 50 meters of teh markers position
    streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
    //open info window on correct marker
    infowindow.open(map, marker);
    }
}
// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21,34));
    return markerImage;
}
