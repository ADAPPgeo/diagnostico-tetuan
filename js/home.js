tetuanApp.controller("MapController", ['leafletMarkerEvents', '$scope', '$location', '$http', 'leafletData',
    function(leafletMarkerEvents, $scope, $location, $http, leafletData){

    //Desplegable de información

    $scope.setActiveInfo = function() {
        if (this.activeInfo !=="act") {
            this.activeInfo = "act";
        } else {
            this.activeInfo ="inact";
        }
    };
    $scope.unsetInfo = function(){
        $scope.activeInfo="inact";
    }
    angular.extend($scope, {
        zona :{
            ventilla: {
                northEast: {
                    lat: 40.4765,
                    lng: -3.6814
                },
                southWest: {
                    lat: 40.4621,
                    lng: -3.7031
                }
            },
            cuatrocaminos: {
                northEast: {
                    lat: 40.4617,
                    lng: -3.6835
                },
                southWest: {
                    lat: 40.4396,
                    lng: -3.711 
                }
            }  
        },
        markers:{},
        legend_anchoacera: {
            position: 'bottomleft',
            colors: [ '#1413f9', '#008000', '#ffa500', '#ff0000'],
            labels: [ 'ancho de acera >1.80 m','ancho de acera 1.20-1.80 m', 'ancho de acera 0.90-1.20 m', 'ancho de acera <0.90 m']
        },
        legend_anchopaso: {
            position: 'bottomleft',
            colors: [ '#008000', '#ffa500', '#ff0000'],
            labels: [ 'ancho de paso > 1.20 m', 'ancho de paso: 0.90-1.20 m', 'ancho de paso < 0.90 m']
        },
        legend_pendiente: {
            position: 'bottomleft',
            colors: [ '#ffffb2', '#fecc5c', '#fd8d3c', '#f03b20', '#bd0026'],
            labels: [ 'pendiente: 0-2%', 'pendiente: 2-4%', 'pendiente: 4-6%','pendiente: 6-8%','pendiente > 8%']
        },
        legend_wheelchair: {
            position: 'bottomleft',
            colors: [ '#008000', '#ffa500', '#ff0000'],
            labels: [ 'ancho de paso > 1.20m y pendiente <2', 'ancho de paso: 0.90-1.20 m y/o pendiente 4-8%', 'ancho de paso < 0.90m y/o pendiente >8%']
        },
        defaults: {
            scrollWheelZoom: true,
            zoomControlPosition: 'topleft',
            zoomAnimation: false,
            markerZoomAnimation: false,
            fadeAnimation: false
        }
    });
    $scope.events = {
        markers: {
            enable: leafletMarkerEvents.getAvailableEvents(),
        }
    };
    angular.extend($scope, {
        maxbounds: $scope.zona.ventilla
    });


    var mbAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors - '+'<a href="http://opendatacommons.org/licenses/odbl/">ODbl</a>, '+'Imagery © <a href="http://mapbox.com">Mapbox</a>'+' Powered by <a href="http://overpass-api.de/">overpass-api.de</a>';
    $scope.definedLayers = {        
        adappgeo: {
            name: 'adappgeo',
            url: 'https://api.mapbox.com/styles/v1/adappgeo/ciuinj30j005p2hpbao9px0ls/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWRhcHBnZW8iLCJhIjoiS1R3dzdFYyJ9.0KP9MaeEuwfUZ2qjBcvxdg',
            type: 'xyz',
            layerOptions: {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors - '+'<a href="http://opendatacommons.org/licenses/odbl/">ODbl</a>, '+'Imagery © <a href="http://mapbox.com">Mapbox</a>',
                showOnSelector: true
            }
        },        
        pnoa: {
            name: 'PNOA',
            url: 'http://www.ign.es/wms-inspire/pnoa-ma',
            type: 'wms',
            format: 'image/png',
            continuousWorld : true,
            layerOptions: {
                layers: 'OI.OrthoimageCoverage',
                format: 'image/png',
                attribution: 'PNOA cedido por © <a href="http://www.ign.es/ign/main/index.do" target="_blank">Instituto Geográfico Nacional de España</a>',
                showOnSelector: false
            },
            layerParams: {
                minZoom: 16,
                maxZoom: 20
            }
        },
        osm: {
            name: 'OpenStreetMap',
            url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            type: 'xyz',
            transparent: false,
            layerOptions: {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors - '+'<a href="http://opendatacommons.org/licenses/odbl/">ODbl</a>, '+'Imagery © <a href="http://mapbox.com">Mapbox</a>',
                showOnSelector: false
            },
            layerParams: {
                minZoom: 15,
                maxZoom: 19
            }
        }
    };
    
    angular.extend($scope, {
        layers: {
            baselayers: {
                osm: $scope.definedLayers.osm
            }
        }
    });

    angular.extend($scope, {
        linegroup: {
            ventilla_anchopaso: {},
            ventilla_pendientes: {},
            ventilla_wheelchair: {},
            ventilla_anchoacera: {},
            ventilla_pasospeaton: {},
            cuatrocaminos_anchopaso: {},
            cuatrocaminos_wheelchair: {},
            cuatrocaminos_anchoacera: {},
            cuatrocaminos_pendientes: {},
            cuatrocaminos_pasospeaton: {}
        }
    });

    $scope.toggleLayer = function() {
        var baselayers = $scope.layers.baselayers;
        if (baselayers.hasOwnProperty('pnoa')) {
            delete baselayers['pnoa'];
            baselayers['osm'] = $scope.definedLayers['osm'];
        } else {
            delete baselayers['osm'];
            baselayers['pnoa'] = $scope.definedLayers['pnoa'];
        }
    };

// markers para barreras

    var addressPointsToMarkers = function(points, tipo) {
        return points.map(function(ap) {                      
            if (ap.properties.ficha){                
                var colorin = 'barrera';                
                var foto;
                var fotoimage = new Image();
                var descripcion;
                var ancho;
                if (ap.properties.filename){
                    //fotoimage.src= 'mapa/diagnosticotetuan/img/fotos/'+ ap.properties.filename;
                    var width = fotoimage.width;
                    var height = fotoimage.height;
                    if(width>height){
                        var posicion = 'landscape';
                    } else {
                        var posicion = 'portrait';
                    }                    
                    //foto = '</br><a href="'+ fotoimage.src +'" target= "blank")">Ver foto </a>';            
                    foto = '<img src="mapa/diagnosticotetuan/img/fotos/' + ap.properties.filename +'"></img>';
                    //foto = fotoimage.src;                    
                } else {
                    foto ='</br>Fotografía no disponible. El punto ha sido obtenido por topografía';
                };
                if (ap.properties.descrip) {
                    descripcion = '</br>' + ap.properties.descrip
                } else {
                    descripcion ='';
                }
                if (ap.properties.ancho_paso) {
                    ancho = '</br>Ancho de paso: '
                    + parseFloat(ap.properties.ancho_paso).toFixed(2)                     
                } else {
                    ancho ='';
                }
                return {
                    id: ap.properties.id,
                    //title: ap.properties.id,                
                    lat: ap.geometry.coordinates[1],
                    lng: ap.geometry.coordinates[0],
                    tipo: ap.properties.tipo,                    
                    calle: ap.properties.calle,
                    photo: ap.properties.filename,                    
                    icon: {
                        type: 'div',
                        iconSize: [0, 0],
                        popupAnchor:  [0, 0],
                        html: '<div class="marker-lonely-' + colorin + '">' + ap.properties.tipo.substring(0,3) + '</div>'
                    },                    
                    message: '<ul class="ficha">'
                    + '<li class="imagen">' + foto + '</li>'


                    + '<li class="contenido">'                   
                    + ap.properties.tipo
                    + '</br>'+ ap.properties.calle
                    + descripcion
                    + ancho
                    + '</br>' + fotoimage.src.substring(49,57)
                    + '</br> id: ' + ap.properties.id
                    + '<h3><a target="_blank" class="social-link" href="https://www.google.es/maps?&'
                    + 'z=20&q=' +ap.geometry.coordinates[1]+'+' + ap.geometry.coordinates[0]+'&ll=' +ap.geometry.coordinates[1]+'+' + ap.geometry.coordinates[0] + '"> <i class="fa fa-map-marker"></i> Google Maps</a></h3>'
                    + '</li>'
                    + '</ul>',
                    //http://maps.google.com/maps?&z=10&q=36.26577+-92.54324&ll=36.26577+-92.54324
                    label: {
                        message: ap.properties.tipo
                    }
                };
            }
            
        });
    };

    $http.get("mapa/diagnosticotetuan/json/cuatrocaminos_barreras.geojson").success(function(data, status) {
        $scope.cuatrocaminos_barreras = addressPointsToMarkers(data.features, 'barreras');
    });
    $http.get("mapa/diagnosticotetuan/json/ventilla_barreras.geojson").success(function(data, status) {
        $scope.ventilla_barreras = addressPointsToMarkers(data.features, 'barreras');
        $scope.markers=$scope.ventilla_barreras;
    });
    
    $scope.longitud_yes =[];

    matrizLongitudes = function(aceras) {
        var longitud_total =[];
        for (var i = aceras.length - 1; i >= 0; i--)  {
            longitud_total[i] = aceras[i].properties.longitud;
        };
        return longitud_total;
    }

//popup para tramos de itinerarios peatonales

    $scope.popup_ip= function(feature,tipotramo){
        var calle,entre,lado;
        var barrera;
        var rangopdte;
        var pdte;
        var descript;
        var propuesta;
        var foto;
        var anchoacera, coloranchoacera, anchoaceratodo;
        var coloranchopaso, anchopasotodo;
        var colorpendiente;
        var colorwheelchair,wheelchair;
        var lugar,entre,lado;
        var bocadillo;
        var tipocruce;
        calle = '<strong>' + feature.properties.addr_stree + '</strong>';
        if (tipotramo=='acera'){
        entre = '<strong> Tramo entre: </strong>' + feature.properties.entre;
        lado = '<strong> Lado: </strong>' + feature.properties.lado;
        lugar = entre + lado;
        } else if (tipotramo=='peatonal'){
        entre = '<strong> Tramo peatonal entre: </strong>' + feature.properties.entre;
        lugar = entre;
        } else if (tipotramo=='pasopeaton'){
        entre = '<strong> cruce con: </strong>' + feature.properties.cruce;
        lugar = entre;
        tipocruce = feature.properties.tipo;
        }
        
        if (feature.properties.ancho_real){
            anchoacera= feature.properties.ancho_real + ' m';
        } else if (tipotramo=='acera'){
            anchoacera = '>1.20';
        };
        switch(feature.properties.ancho_acer){
            case 'adapt':
                coloranchoacera = 'blue';
                break;
            case 'yes':
                coloranchoacera = 'green';
                break;
            case null:
                coloranchoacera = 'green';
                break;
            case 'limited':
                coloranchoacera = 'orange';
                break;
            case 'no':
                coloranchoacera ='red';
                break;
            }
        anchoaceratodo = '<i style="background:' + coloranchoacera +'"></i><strong>Ancho de acera: </strong>' + anchoacera;
        switch(feature.properties.ancho_paso){
            case 'yes':
                coloranchopaso = 'green';
                break;
            case null:
                coloranchopaso = 'green';
                break;
            case 'limited':
                coloranchopaso = 'orange';
                break;
            case 'no':
                coloranchopaso ='red';
        }
        anchopasotodo = '<i style="background:' + coloranchopaso +'"></i><strong>Ancho de paso: </strong>' + feature.properties.ancho_paso;
        if (feature.properties.pendiente){
            switch(feature.properties.pendiente){
                case '0':
                    rangopdte = '0-2';
                    colorpendiente = '#ffffb2'
                    break;
                case '2':
                    rangopdte = '2-4';
                    colorpendiente = '#fecc5c' 
                    break;
                case '4':
                    rangopdte ='4-6';
                    colorpendiente = '#fd8d3c'
                    break;
                case '6':
                    rangopdte = '6-8';
                    colorpendiente = '#f03b20'
                    break;
                case '8':
                    rangopdte ='>8';
                    colorpendiente = '#bd0026'
                    break;
            }
            pdte= '<i style="background:' + colorpendiente +'"></i><strong>Pendiente: </strong>' + rangopdte + '%';
        } else {
            pdte= '';
        };
        switch(feature.properties.wheelchair){
            case 'yes':
                colorwheelchair = 'green';
                break;
            case 'limited':
                colorwheelchair = 'orange';
                break;
            case 'no':
                colorwheelchair ='red';
        }
        wheelchair = '<i style="background:' + colorwheelchair +'"></i><strong>Accesibilidad: </strong>' + feature.properties.wheelchair;

        if (feature.properties.barrera != null){
            barrera = '<strong>barreras: </strong>' + feature.properties.barrera;
        } else {
            barrera ='';
        };
        if (feature.properties.descrip){
            descript = '<strong>Descripción: </strong>' + feature.properties.descrip;
        } else {
            descript='';
        };
        if (feature.properties.propuesta){
            propuesta = '<strong>Propuesta: </strong>' + feature.properties.propuesta;
        } else {
            propuesta='';
        };
        if (feature.properties.filename){
            foto = '<img src="mapa/diagnosticotetuan/img/fotos/' + feature.properties.filename +'"></img>';
        } else{
            foto='';
        }
        //popup aceras
        if (tipotramo=='acera'){
            bocadillo = '<ul class="ficha">'
            + '<li class="imagen">' + foto + '</li>'
            + '<li class="extra">'
            + '<ul class="propiedades">'
            + '<li> <strong>ID tramo: </strong>' + feature.properties.id + '</li>'
            + '<li>' + anchoaceratodo + '</li>'
            + '<li>' + anchopasotodo + '</li>'
            + '<li>' + pdte + '</li>'
            + '<li>' + wheelchair + '</li>'
            + '</ul>'
            + '</li>' 
            + '<li class="contenido">'
            + '<ul class="descripcion">'
            + '<li>' + calle + '</li>'
            + '<li>' + entre + '</li>'
            + '<li>' + lado + '</li>'
            + '<li> <strong>Longitud tramo: </strong>' + feature.properties.longitud + ' m</li>'

            + '<li>' + barrera + '</li>'
            + '<li>' + descript + '</li>'
            + '<li>' + propuesta + '</li>'
            + '</ul>'
            + '</li>'
            + '</ul>';
        }
        //popup paso de peatón
        if (tipotramo == 'pasopeaton'){
            bocadillo = '<h2>' + tipocruce + '</h2>'
            + '<ul class="ficha">'
            + '<li class="imagen">' + foto + '</li>'
            + '<li class="contenido">'
            + '<ul class="descripcion">'
            + '<li>' + calle + '</li>'
            + '<li>' + lugar + '</li>'
            + '<li> <strong>ID tramo: </strong>' + feature.properties.id + '</li>'
            + '<li> <strong>Longitud tramo: </strong>' + feature.properties.longitud + ' m</li>'
            + descript
            + '</ul>'
            + '</li>'
            + '</ul>';
        }

        //popup zona peatonal
        if (tipotramo == 'peatonal'){
            bocadillo = '<ul class="ficha">'
            + '<li class="imagen">' + foto + '</li>'
            + '<li class="contenido">'
            + '<ul class="descripcion">'
            + '<li>' + calle + '</li>'
            + '<li>' + lugar + '</li>'
            + '<li><strong>ID tramo: </strong>' + feature.properties.id  + '</li>'
            + '</ul>'
            + '</li>'

            + '</ul>';   
        }   
        
        //popup escaleras
        if (tipotramo == 'escalera'){
            bocadillo ='<h2>Escaleras</h2>'
            + '<ul class="ficha">'
            + '<li class="imagen">' + foto + '</li>'
            + '<li class="contenido">'
            + '</br>' + calle 
            + '</br> <strong>ID tramo: </strong>' + feature.properties.id            
            + '</br> <strong>Rampa: </strong>' + feature.properties.ramp            
            + '</br> <strong>Pasamanos: </strong>' + feature.properties.handrail
            + '</li>'
            + '</ul>';   
        }
        return bocadillo;
    }
/*Entidades lineales correspondientes al barrio de Ventilla*/
    $http.get('mapa/diagnosticotetuan/json/ventilla_ip_pasospeaton.geojson').success(function(data) {      
        angular.extend($scope.linegroup.ventilla_pasospeaton, {
            ventilla_cruces_yes: {
                data: data.features,                    
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.wheelchair == 'yes';
                },                    
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'pasopeaton'));
                },
                style: {
                    weight: 5,
                    color: 'green',
                    dashArray: '3',
                    opacity: 1
                }
            },
            ventilla_cruces_limited: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.wheelchair == 'limited';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'pasopeaton'));
                },
                style: {
                    weight: 5,
                    color: 'orange',
                    dashArray: '3',
                    opacity: 1
                }
            },
            ventilla_cruces_no: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.wheelchair == 'no';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'pasopeaton'));
                },
                style: {
                    weight: 5,
                    color: 'red',
                    dashArray: '3',
                    opacity: 1
                }
            }
        });
    });
    $http.get('mapa/diagnosticotetuan/json/ventilla_ip_aceras.geojson').success(function(data) {
        angular.extend($scope.linegroup.ventilla_anchoacera, {
            ventilla_ip_pasospeaton_yes: $scope.linegroup.ventilla_pasospeaton.ventilla_cruces_yes,
            ventilla_ip_pasospeaton_limited: $scope.linegroup.ventilla_pasospeaton.ventilla_cruces_limited,
            ventilla_ip_pasospeaton_no: $scope.linegroup.ventilla_pasospeaton.ventilla_cruces_no,
            ventilla_ip_anchoaceras_adapt: {
                data: data.features,                    
                filter: function(feature, layer) {
                    if (feature.properties.ancho_real)
                    return feature.properties.ancho_real >= 1.8;
                },                    
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: 'blue',
                    opacity: 1
                }
            },
            ventilla_ip_anchoaceras_yes: {
                data: data.features,                    
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.ancho_acer == 'yes';
                },                    
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: 'green',
                    opacity: 1
                }
            },
            ventilla_ip_anchoaceras_limited: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.ancho_acer == 'limited';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: 'orange',
                    opacity: 1
                }
            },
            ventilla_ip_anchoaceras_aceras_no: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.ancho_acer == 'no';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));                    
                },
                style: {
                    weight: 5,
                    color: 'red',
                    dashArray: '6',
                    opacity: 1
                }
            },
            ventilla_ip_pedestrian: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.footway =='pedestrian';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'peatonal'));
                },
                style: {
                    weight: 5,
                    color: '#0bb10b',
                    opacity: 1
                }
            },
            ventilla_ip_steps: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.highway =='steps';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'escalera'));
                },
                style: {
                    weight: 5,
                    color: 'red',
                    dashArray: '6',
                    opacity: 1
                }
            }                  
        });
        angular.extend($scope.linegroup.ventilla_anchopaso, {
            ventilla_ip_pasospeaton_yes: $scope.linegroup.ventilla_pasospeaton.ventilla_cruces_yes,
            ventilla_ip_pasospeaton_limited: $scope.linegroup.ventilla_pasospeaton.ventilla_cruces_limited,
            ventilla_ip_pasospeaton_no: $scope.linegroup.ventilla_pasospeaton.ventilla_cruces_no,
            ventilla_ip_anchopaso_yes: {
                data: data.features,                    
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.ancho_paso == 'yes';
                },                    
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: 'green',
                    opacity: 1
                }
            },
            ventilla_ip_anchopaso_limited: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.ancho_paso == 'limited';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: 'orange',
                    opacity: 1
                }
            },
            ventilla_ip_anchopaso_no: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.ancho_paso == 'no';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));                    
                },
                style: {
                    weight: 5,
                    color: 'red',
                    dashArray: '8',
                    opacity: 1
                }
            },
            ventilla_ip_pedestrian: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.footway =='pedestrian';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'peatonal'));
                },
                style: {
                    weight: 5,
                    color: '#0bb10b',
                    opacity: 1
                }
            },
            ventilla_ip_steps: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.highway =='steps';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'escalera'));
                },
                style: {
                    weight: 5,
                    color: 'red',
                    dashArray: '6',
                    opacity: 1
                }
            }                 
        });
        angular.extend($scope.linegroup.ventilla_wheelchair, {
            ventilla_ip_pasospeaton_yes: $scope.linegroup.ventilla_pasospeaton.ventilla_cruces_yes,
            ventilla_ip_pasospeaton_limited: $scope.linegroup.ventilla_pasospeaton.ventilla_cruces_limited,
            ventilla_ip_pasospeaton_no: $scope.linegroup.ventilla_pasospeaton.ventilla_cruces_no,
            ventilla_ip_wheelchair_yes: {
                data: data.features,                    
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.wheelchair == 'yes';
                },                    
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: 'green',
                    opacity: 1
                }
            },
            ventilla_ip_wheelchair_limited: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.wheelchair == 'limited';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: 'orange',
                    opacity: 1
                }
            },
            ventilla_ip_wheelchair_no: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.wheelchair == 'no';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: 'red',
                    dashArray: '6',
                    opacity: 1
                }
            }                
        });
        angular.extend($scope.linegroup.ventilla_pendientes, {
            green: {
                data: data.features,                    
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.pendiente == '0';
                },                    
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: '#ffffb2',
                    dashArray: '3',
                    opacity: 1
                }
            },
            yellow: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.pendiente == '2';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: '#fecc5c',
                    dashArray: '3',
                    opacity: 1
                }
            },
            orange: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.pendiente == '4';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: '#fd8d3c',
                    dashArray: '3',
                    opacity: 1
                }
            },
            red: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.pendiente == '6';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: '#f03b20',
                    dashArray: '3',
                    opacity: 1
                }
            },
            magenta: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.pendiente == '8';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: '#bd0026',
                    dashArray: '3',
                    opacity: 1
                }
            }                 
        });
    });

/*Entidades lineales correspondientes al barrio de Cuatro Caminos*/

    $http.get('mapa/diagnosticotetuan/json/cuatrocaminos_ip_pasospeaton.geojson').success(function(data) {      
        angular.extend($scope.linegroup.cuatrocaminos_pasospeaton, {
            cuatrocaminos_cruces_yes: {
                data: data.features,                    
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.wheelchair == 'yes';
                },                    
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'pasopeaton'));
                },
                style: {
                    weight: 5,
                    color: 'green',
                    opacity: 1
                }
            },
            cuatrocaminos_cruces_limited: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.wheelchair == 'limited';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'pasopeaton'));
                },
                style: {
                    weight: 5,
                    color: 'orange',
                    opacity: 1
                }
            },
            cuatrocaminos_cruces_no: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.wheelchair == 'no';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'pasopeaton'));
                },
                style: {
                    weight: 5,
                    color: 'red',
                    dashArray: '3',
                    opacity: 1
                }
            }                
        
        });
    });
    $http.get('mapa/diagnosticotetuan/json/cuatrocaminos_ip_aceras.geojson').success(function(data) {
        angular.extend($scope.linegroup.cuatrocaminos_anchoacera, {
            cuatrocaminos_ip_pasospeaton_yes: $scope.linegroup.cuatrocaminos_pasospeaton.cuatrocaminos_cruces_yes,
            cuatrocaminos_ip_pasospeaton_limited: $scope.linegroup.cuatrocaminos_pasospeaton.cuatrocaminos_cruces_limited,
            cuatrocaminos_ip_pasospeaton_no: $scope.linegroup.cuatrocaminos_pasospeaton.cuatrocaminos_cruces_no,
            cuatrocaminos_ip_anchoaceras_adapt: {
                data: data.features,                    
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.ancho_real >= 1.8;
                },                    
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: 'blue',
                    opacity: 1
                }
            },
            cuatrocaminos_ip_anchoaceras_yes: {
                data: data.features,                    
                filter: function(feature, layer) {
                    if (feature.properties)
                    return (feature.properties.ancho_real >= 1.2 && feature.properties.ancho_real < 1.8) || feature.properties.ancho_real == null;
                },                    
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: 'green',
                    opacity: 1
                }
            },
            cuatrocaminos_ip_anchoaceras_limited: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.ancho_acer == 'limited';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: 'orange',
                    opacity: 1
                }
            },
            cuatrocaminos_ip_anchoaceras_aceras_no: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.ancho_acer == 'no';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));                    
                },
                style: {
                    weight: 5,
                    color: 'red',
                    dashArray: '6',
                    opacity: 1
                }
            }                
        });    
        angular.extend($scope.linegroup.cuatrocaminos_anchopaso, {
            cuatrocaminos_ip_pasospeaton_yes: $scope.linegroup.cuatrocaminos_pasospeaton.cuatrocaminos_cruces_yes,
            cuatrocaminos_ip_pasospeaton_limited: $scope.linegroup.cuatrocaminos_pasospeaton.cuatrocaminos_cruces_limited,
            cuatrocaminos_ip_pasospeaton_no: $scope.linegroup.cuatrocaminos_pasospeaton.cuatrocaminos_cruces_no,
            cuatrocaminos_ip_yes: {
                data: data.features,                    
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.ancho_paso == 'yes';
                },                    
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: 'green',
                    opacity: 1
                }
            },
            cuatrocaminos_ip_limited: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.ancho_paso == 'limited';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: '#ff5c00',
                    opacity: 1
                }
            },
            cuatrocaminos_ip_no: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.ancho_paso == 'no';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: 'red',
                    dashArray: '6',
                    opacity: 1
                }
            },
            cuatrocaminos_ip_pedestrian: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.footway =='pedestrian';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'peatonal'));
                },
                style: {
                    weight: 5,
                    color: '#0bb10b',
                    opacity: 1
                }
            },
            cuatrocaminos_ip_steps: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.highway =='steps';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'escalera'));
                },
                style: {
                    weight: 5,
                    color: 'red',
                    dashArray: '6',
                    opacity: 1
                }
            }                                  
        });
        angular.extend($scope.linegroup.cuatrocaminos_pendientes, {
            green: {
                data: data.features,                    
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.pendiente == '0';
                },                    
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: '#ffffb2',
                    opacity: 1
                }
            },
            yellow: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.pendiente == '2';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: '#fecc5c',
                    opacity: 1
                }
            },
            orange: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.pendiente == '4';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: '#fd8d3c',
                    opacity: 1
                }
            },
            red: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.pendiente == '6';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: '#f03b20',
                    opacity: 1
                }
            },
            magenta: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.pendiente == '8';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: '#bd0026',
                    opacity: 1
                }
            }                 
        });
        angular.extend($scope.linegroup.cuatrocaminos_wheelchair, {
            cuatrocaminos_ip_pasospeaton_yes: $scope.linegroup.cuatrocaminos_pasospeaton.cuatrocaminos_cruces_yes,
            cuatrocaminos_ip_pasospeaton_limited: $scope.linegroup.cuatrocaminos_pasospeaton.cuatrocaminos_cruces_limited,
            cuatrocaminos_ip_pasospeaton_no: $scope.linegroup.cuatrocaminos_pasospeaton.cuatrocaminos_cruces_no,
            cuatrocaminos_ip_wheelchair_yes: {
                data: data.features,                    
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.wheelchair == 'yes';
                },                    
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: 'green',
                    opacity: 1
                }
            },
            cuatrocaminos_ip_wheelchair_limited: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                        return feature.properties.wheelchair == 'limited';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: '#ff5c00',
                    opacity: 1
                }
            },
            cuatrocaminos_ip_wheelchair_no: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.wheelchair == 'no';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'acera'));
                },
                style: {
                    weight: 5,
                    color: 'red',
                    dashArray: '6',
                    opacity: 1
                }
            },
            cuatrocaminos_ip_pedestrian: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.footway =='pedestrian';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'peatonal'));
                },
                style: {
                    weight: 5,
                    color: '#0bb10b',
                    opacity: 1
                }
            },
            cuatrocaminos_ip_steps: {
                data: data.features,
                filter: function(feature, layer) {
                    if (feature.properties)
                    return feature.properties.highway =='steps';
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup($scope.popup_ip(feature,'escalera'));
                },
                style: {
                    weight: 5,
                    color: 'red',
                    dashArray: '6',
                    opacity: 1
                }
            }                                  
        });
    });
    
//Control de capas y barrios

    $scope.setSelectedTopic = function(tipo){        
        $scope.selectedtopic= tipo;
        console.log('tipo seleccionado: ' + tipo);      
        };
    $scope.setSelectedAceras = function(aceras){
        switch(aceras) {
            case 'anchoacera':
                $scope.legend = $scope.legend_anchoacera;
                if ($scope.barrio== 'Ventilla'){
                    $scope.definedOverlays = $scope.linegroup.ventilla_anchoacera;
                }
                if ($scope.barrio== 'Cuatro Caminos'){
                    $scope.definedOverlays = $scope.linegroup.cuatrocaminos_anchoacera;
                }
                break;
            case 'pendiente':
                $scope.legend = $scope.legend_pendiente;
                if ($scope.barrio== 'Ventilla'){
                    $scope.definedOverlays = $scope.linegroup.ventilla_pendientes;
                }
                if ($scope.barrio== 'Cuatro Caminos'){
                    $scope.definedOverlays = $scope.linegroup.cuatrocaminos_pendientes;
                }
                break;
            case 'anchosdepaso':
                $scope.legend = $scope.legend_anchopaso;
                if ($scope.barrio== 'Ventilla'){
                    $scope.definedOverlays = $scope.linegroup.ventilla_anchopaso;
                }
                if ($scope.barrio== 'Cuatro Caminos'){
                    $scope.definedOverlays = $scope.linegroup.cuatrocaminos_anchopaso;
                }
                break;
            case 'wheelchair':
                $scope.legend = $scope.legend_wheelchair;
                if ($scope.barrio== 'Ventilla'){
                    $scope.definedOverlays = $scope.linegroup.ventilla_wheelchair;
                }
                if ($scope.barrio== 'Cuatro Caminos'){
                    $scope.definedOverlays = $scope.linegroup.cuatrocaminos_wheelchair;
                }
                break;
        }
    };
    $scope.setSelectedFotos = function(){
        if ($scope.barrio=='Cuatro Caminos'){            
            $scope.markers=$scope.cuatrocaminos_barreras;
        } else if ($scope.barrio=='Ventilla'){
            $scope.markers=$scope.ventilla_barreras;
        }
    };    
    $scope.setSelectedBarrio=function(barrio){
        $scope.setSelectedTopic('ninguna');
        if (barrio=='Cuatro Caminos'){
            $scope.barrio = 'Cuatro Caminos';
            $scope.definedOverlays = $scope.linegroup.cuatrocaminos_anchopaso;
            $scope.markers = $scope.cuatrocaminos_barreras; 
            $scope.maxbounds = $scope.zona.cuatrocaminos;
        }
        if (barrio=='Ventilla'){
            $scope.barrio = 'Ventilla';
            $scope.definedOverlays = $scope.linegroup.ventilla_anchopaso;
            $scope.markers = $scope.ventilla_barreras; 
            $scope.maxbounds = $scope.zona.ventilla;
        }
        $scope.legend = $scope.legend_anchopaso;    
        $scope.setSelectedFotos();
    };
    //$scope.markers= $scope.ventilla_barreras;
    angular.extend($scope, {
        barrio: 'Ventilla',
        markers: $scope.ventilla_barreras
    });
            $scope.markers = $scope.ventilla_barreras; 

    console.log('barrio seleccionado: ' + $scope.barrio);
    $scope.setSelectedFotos();
    $scope.setSelectedBarrio($scope.barrio);
    $scope.setSelectedTopic('ninguna');
}]);