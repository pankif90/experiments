//Управление drawFunctions
(function()
{
	var outlineColor = 0x0000ff;
	var fillColor = 0xffffff;
	var currentDOMObject = null;		// текущий обьект рисования
	var pSize = 28;
	var pointSize = pSize / 2;
	var lineWidth = 3;
	var mouseOverFlag = false;
	var mousePressed = false;

	var chkStyle = function(drawAttr, regularStyle, hoveredStyle) {
		if(drawAttr['regularStyle']) {
			var opacity = ('opacity' in drawAttr['regularStyle'] ? drawAttr['regularStyle']['opacity']/100 : 1);
			var color = ('color' in drawAttr['regularStyle'] ? drawAttr['regularStyle']['color'] : 0xff);
			drawAttr['strokeStyle']['color'] = gmxAPI._leaflet['utils'].dec2rgba(color, opacity);
			var weight = ('weight' in drawAttr['regularStyle'] ? drawAttr['regularStyle']['weight'] : lineWidth);
			drawAttr['stylePolygon'] = {
				'color': gmxAPI._leaflet['utils'].dec2rgba(color, opacity)
				,'weight': weight
				,'opacity': opacity
				
			};
			drawAttr['stylePoint'] = gmxAPI.clone(stylePoint);
			drawAttr['stylePoint']['pointSize'] = pointSize;
			drawAttr['stylePoint']['color'] = drawAttr['stylePolygon']['color'];
			drawAttr['stylePoint']['weight'] = drawAttr['stylePolygon']['weight'];
			drawAttr['stylePoint']['fillOpacity'] = 
			drawAttr['stylePoint']['opacity'] = drawAttr['stylePolygon']['opacity'];
		}
	}
	
	var getLongLatLng = function(lat, lng)
	{
		var point = new L.LatLng(lat, lng);
		if(lng > 180) point.lng = lng;
		else if(lng < -180) point.lng = lng;
		return point;
	}
	var getDownType = function(ph, coords)
	{
		var out = {};
		var dBounds = new L.Bounds();
		for (var i = 0; i < coords.length; i++)
		{
			var pArr = coords[i];
			dBounds.extend(new L.Point(pArr[0],  pArr[1]));
		}
		var dx = getDeltaX(dBounds);
		var point = getLongLatLng(ph.latlng.lat, ph.latlng.lng);
		var p1 = gmxAPI._leaflet['LMap'].project(point);
		var size = pointSize + lineWidth;
		
		var cursorBounds = new L.Bounds();
		var p = gmxAPI._leaflet['LMap'].unproject(new L.Point(p1.x - size, p1.y - size));
		cursorBounds.extend(new L.Point(p['lng'],  p['lat']));
		p = gmxAPI._leaflet['LMap'].unproject(new L.Point(p1.x + size, p1.y + size));
		cursorBounds.extend(new L.Point(p['lng'],  p['lat']));

		var len = coords.length;
		for (var i = 0; i < len; i++)
		{
			var pArr = coords[i];
			var x = pArr[0] + dx;
			var y = pArr[1];
			//var pBounds = getBoundsPoint(pArr[0] + dx, pArr[1]);
			if(cursorBounds.max.x < x || cursorBounds.min.x > x || cursorBounds.max.y < y || cursorBounds.min.y > y) {
				var p2 = gmxAPI._leaflet['LMap'].project(getLongLatLng(pArr[1], x));
				var jj = i + 1;
				if(jj >= len) jj = 0;
				var x = coords[jj][0] + dx;
				var point1 = gmxAPI._leaflet['LMap'].project(getLongLatLng(coords[jj][1], x));
				var x1 = p2.x - p1.x; 			var y1 = p2.y - p1.y;
				var x2 = point1.x - p1.x;		var y2 = point1.y - p1.y;
				var dist = L.LineUtil.pointToSegmentDistance(p1, p2, point1) - lineWidth;
				if (dist < lineWidth)
				{
					out = {'type': 'edge', 'num':jj};
				}
			} else {
				out = {'type': 'node', 'num':i};
				break;
			}
		}
		return out;
	}

	var getBoundsPoint = function(x, y)
	{
		var point = new L.LatLng(y, x);
		point.lng = x;
		point.lat = y;
		var pix = gmxAPI._leaflet['LMap'].project(point);
		var p1 = gmxAPI._leaflet['LMap'].unproject(new L.Point(pix['x'] - pointSize, pix['y'] + pointSize));
		var p2 = gmxAPI._leaflet['LMap'].unproject(new L.Point(pix['x'] + pointSize, pix['y'] - pointSize));
		return bounds = new L.LatLngBounds(p1, p2);
	}

	var getDeltaX = function(bounds)
	{
		var dx = 0;
		var centerObj = (bounds.max.x + bounds.min.x)/2;
		var latlng = new L.LatLng(0, centerObj);
		if(centerObj > 180) latlng.lng = centerObj;
		//else if(centerObj < -180) latlng.lng -= 180;
		var pixelCenterObj = gmxAPI._leaflet['LMap'].project(latlng);
		
		var point = gmxAPI._leaflet['LMap'].project(new L.LatLng(0, -180));
		var p180 = gmxAPI._leaflet['LMap'].project(new L.LatLng(0, 180));
		var worldSize = p180.x - point.x;
		
		var pixelBounds = gmxAPI._leaflet['LMap'].getPixelBounds();
		var centerViewport = (pixelBounds.max.x + pixelBounds.min.x)/2;
		
		var dist = pixelCenterObj.x - centerViewport;
		var delta = Math.abs(dist);
		var delta1 = Math.abs(dist + worldSize);
		var delta2 = Math.abs(dist - worldSize);
		if(delta1 < delta) dx = 360;
		if(delta2 < delta && delta2 < delta1) dx = -360;
		return dx;
	}

	var tmpPoint = null;
	var styleStroke = {color: "#0000ff", weight: lineWidth , opacity: 1};
	var stylePoint = {color: "#0000ff", fill: true, fillColor: "#ffffff", weight: lineWidth, opacity: 1, fillOpacity: 1, 'pointSize': pointSize, skipLastPoint: true, skipSimplifyPoint: true, clickable: true};
	var stylePolygon = {color: "#0000ff", weight: lineWidth + 2, opacity: 1, clickable: false};
	//var stylePolygon = {color: "#0000ff", fillColor: "#ff0000", weight: lineWidth + 2, opacity: 1, fillOpacity: 0.5, clickable: true};
	//var stylePolygon = {fill: true, fillColor: "#ff0000", weight: lineWidth, opacity: 0.1, fillOpacity: 1, 'pointSize': pointSize, clickable: true};
	//var stylePolygon = {color: "#0000ff", fill: true, fillColor: "#0000ff", weight: 0, opacity: 1, fillOpacity: 1, 'pointSize': lineWidth/2, clickable: true};
	var hiddenPolygon = {fill: true, fillColor: "#0000ff", weight: 0, opacity: 1, fillOpacity: 0, 'pointSize': lineWidth/2, clickable: true};

	var drawSVG = function(attr)
	{
		var layerGroup = attr['layerGroup'];
		if(!layerGroup._map) return;
		var layerItems = attr['layerItems'];
		//console.log('drawSVG:  ', attr['coords'].length);
		var dBounds = new L.Bounds();
		for (var i = 0; i < attr['coords'].length; i++)
		{
			var pArr = attr['coords'][i];
			dBounds.extend(new L.Point(pArr[0],  pArr[1]));
		}

		var dx = getDeltaX(dBounds);

		if(layerItems.length == 0) {
			var tstyle = attr['stylePolygon'] || stylePolygon;
			layerItems.push(new L.Polyline([], tstyle));
			var hstyle = attr['hiddenPolygon'] || hiddenPolygon;
			layerItems.push(new L.GMXLinesFill([], hstyle));

			var pstyle = attr['stylePoint'] || stylePoint;
			//pstyle['skipLastPoint'] = (attr['editType'] !== 'LINESTRING');
			layerItems.push(new L.GMXPointsMarkers([], pstyle));
			/*if('skipLastPoint' in attr) {
				layerItems[2].options['skipLastPoint'] = attr['skipLastPoint'];
				delete attr['skipLastPoint'];
			}*/

			layerGroup.addLayer(layerItems[0]);
			layerGroup.addLayer(layerItems[1]);
			layerGroup.addLayer(layerItems[2]);

			layerItems[2]._container.style.pointerEvents = 'visiblePainted';
			layerItems[0]._container.style.pointerEvents = 'none';
			layerItems[1]._container.style.pointerEvents = (!attr['isExternal'] && attr['editType'] !== 'FRAME' ? 'none':'visiblePainted');

			layerItems[1].on('mousedown', function(e) {
				if(attr['mousedown']) attr['mousedown'](e);
			}, this);
			layerItems[2].on('mousedown', function(e) {
				if(attr['mousedown']) attr['mousedown'](e);
			}, this);
			layerItems[2].on('dblclick', function(e) {
				if(attr['dblclick']) attr['dblclick'](e);
			}, this);
		}
		layerGroup.bringToFront();
		
		//if(layerItems[1].options.skipSimplifyPoint == mousePressed) { layerItems[1].options.skipSimplifyPoint = !mousePressed; }
		
		var latLngs = [];
		var latLngsPoints = [];
		for (var i = 0, len = attr['coords'].length; i < len; i++)
		{
			var pArr = attr['coords'][i];
			var latLng = new L.LatLng(pArr[1], pArr[0] + dx);
			latLngs.push(latLng);
		}
		if(attr['lastPoint']) {
			var latLng = new L.LatLng(attr['lastPoint']['y'], attr['lastPoint']['x'] + dx);
			latLngs.push(latLng);
		}
		layerItems[0].setLatLngs(latLngs);
		layerItems[1].setLatLngs(latLngs);
		layerItems[2].setLatLngs(latLngs);
	}

	function getGeometryTitle(geom)
	{
		var geomType = geom['type'];
		if (geomType.indexOf("POINT") != -1)
		{
			var c = geom.coordinates;
			return "<b>" + gmxAPI.KOSMOSNIMKI_LOCALIZED("Координаты:", "Coordinates:") + "</b> " + gmxAPI.LatLon_formatCoordinates(c[0], c[1]);
		}
		else if (geomType.indexOf("LINESTRING") != -1)
			return "<b>" + gmxAPI.KOSMOSNIMKI_LOCALIZED("Длина:", "Length:") + "</b> " + gmxAPI.prettifyDistance(gmxAPI.geoLength(geom));
		else if (geomType.indexOf("POLYGON") != -1)
			return "<b>" + gmxAPI.KOSMOSNIMKI_LOCALIZED("Площадь:", "Area:") + "</b> " + gmxAPI.prettifyArea(gmxAPI.geoArea(geom));
		else
			return "?";
	}
	
	var regularDrawingStyle = {
		marker: { size: 3 },
		outline: { color: outlineColor, thickness: 3, opacity: 80 },
		fill: { color: fillColor }
	};
	var hoveredDrawingStyle = { 
		marker: { size: 4 },
		outline: { color: outlineColor, thickness: 4 },
		fill: { color: fillColor }
	};

	var getStyle = function(removeDefaults, mObj){
		var out = mObj.getStyle( removeDefaults );
		if(out && !removeDefaults) {
			if(!out.regular) out.regular = regularDrawingStyle;
			if(!out.hovered) out.hovered = hoveredDrawingStyle;
		}
		return out;
	};
	
	var objects = {};
	//var multiObjects = {};
	var drawFunctions = {};

	var chkDrawingObjects = function() {
		for (var id in objects) {
			var cObj = objects[id];
			if(!cObj.geometry) cObj.remove();
		}
	};
	var endDrawing = function() {			// Вызывается при выходе из режима редактирования
		chkDrawingObjects();
		currentDOMObject = null;
		gmxAPI._drawing['activeState'] = false;
	};

	var createDOMObject = function(ret, properties, propHiden)
	{
		var myId = gmxAPI.newFlashMapId();
		var myContents;
		var callHandler = function(eventName)
		{
			var handlers = gmxAPI.map.drawing.handlers[eventName] || [];
			for (var i = 0; i < handlers.length; i++)
				handlers[i](objects[myId]);

			gmxAPI._listeners.dispatchEvent(eventName, gmxAPI.map.drawing, objects[myId]);
		}
		var addHandlerCalled = false;
		objects[myId] = {
			properties: properties || {},
			propHiden: propHiden || {},
			setText: ret.setText,
			setVisible: function(flag)
			{
				ret.setVisible(flag);
				this.properties.isVisible = flag;
			},
/*			updateCoordinates: function(coords)
			{
				if(coords.type) coords = coords.coordinates;	// Если это geometry берем только координаты
				if(!coords) return;				// Если нет coords ничего не делаем
				ret.updateCoordinates(coords);
			},
*/
			update: function(geometry, text)
			{
				if(!geometry) return;				// Если нет geometry ничего не делаем
				this.properties.text = text;
				this.properties.isVisible = ret.isVisible;
				this.geometry = geometry;
				this.balloon = ret.balloon;
				callHandler(addHandlerCalled ? "onEdit" : "onAdd");
				addHandlerCalled = true;
			},
			remove: function() { ret.remove(); },
			removeInternal: function()
			{
				callHandler("onRemove");
				delete objects[myId];
			},
			chkZindex: function()
			{
				if('chkZindex' in ret) ret.chkZindex();
			},
			triggerInternal: function( callbackName ){ callHandler(callbackName); },
			getGeometry: function() { return gmxAPI.clone(this.geometry); },
			getLength: function() { return gmxAPI.geoLength(this.geometry); },
			getArea: function() { return gmxAPI.geoArea(this.geometry); },
			getCenter: function() { return gmxAPI.geoCenter(this.geometry); },
			setStyle: function(regularStyle, hoveredStyle) { ret.setStyle(regularStyle, hoveredStyle); },
			getVisibleStyle: function() { return ret.getVisibleStyle(); },
			getStyle: function(removeDefaults) { return ret.getStyle(removeDefaults); },
			stateListeners: {},
			addListener: function(eventName, func) { return gmxAPI._listeners.addListener({'obj': this, 'eventName': eventName, 'func': func}); },
			removeListener: function(eventName, id)	{ return gmxAPI._listeners.removeListener(this, eventName, id); }
		}
		if('chkMouse' in ret) objects[myId]['chkMouse'] = ret.chkMouse;
		if('getItemDownType' in ret) objects[myId]['getItemDownType'] = ret.getItemDownType;
		if('itemMouseDown' in ret) objects[myId]['itemMouseDown'] = ret.itemMouseDown;

		currentDOMObject = ret.domObj = objects[myId];
		return objects[myId];
	}

	var editObject = function(coords, props, editType, propHiden)
	{
		if (!props)
			props = {};

		var text = props.text;
		if (!text)
			text = "";

		var mapNodes = gmxAPI._leaflet['mapNodes'];					// Хэш нод обьектов карты - аналог MapNodes.hx
		var drawAttr = {
			'editType': editType
			,
			'strokeStyle': {
				'color': 'rgba(0, 0, 255, 1)'
			}
			,
			'fillStyle': {
				'color': 'rgba(255, 255, 255, 0.8)'
			}
			,
			'fillStylePolygon': {
				'color': 'rgba(255, 255, 255, 0.3)'
			}
		};

		var domObj = false;
		var toolsContainer = null;
		
		var propsBalloon = (gmxAPI.map.balloonClassObject ? gmxAPI.map.balloonClassObject.propsBalloon : null);
		var node = null;
		var oBounds = null;
		var addItemListenerID = null;
		var onMouseMoveID = null;
		var onMouseUpID = null;
		//var pCanvas = null;
		var pSize = 8;
		var lineWidth = 3;
		var pointSize = pSize / 2;
		var lastPoint = null;
		var needInitNodeEvents = true;
		var editIndex = -1;
		var finishTime = 0;
		var isFinish = false;
		var downTime = 0;
		var mouseDownFunc = null;
		var initMove = null;
		var skipClick = false;
		
		mouseOverFlag = false;

		var drawingUtils = {
			'disablePointerEvents': function(flag) {		// отключить мышь на SVG обьектах
				if(layerItems.length == 0) return;
				layerItems[1]._container.style.pointerEvents = layerItems[2]._container.style.pointerEvents = 'none';
				if(flag !== undefined) layerItems[2].options['skipLastPoint'] = flag;
			}
			,
			'enablePointerEvents': function(flag) {			// включить мышь на SVG обьектах
				if(layerItems.length == 0) return;
				layerItems[1]._container.style.pointerEvents = layerItems[2]._container.style.pointerEvents = 'visiblePainted';
				if(flag !== undefined) layerItems[2].options['skipLastPoint'] = flag;
			}
			,
			'hideBalloon': function() {						// выключить балун
				if(propsBalloon && propsBalloon.isVisible()) propsBalloon.updatePropsBalloon(false);
			}
		};
	
		var mouseUp = function()
		{
			mousePressed = false;
			if(onMouseUpID) gmxAPI.map.removeListener('onMouseUp', onMouseUpID);
			onMouseUpID = null;
			gmxAPI._cmdProxy('stopDrawing');
			if(onMouseMoveID) gmxAPI.map.removeListener('onMouseMove', onMouseMoveID);
			onMouseMoveID = null;
			gmxAPI._drawing['activeState'] = false;
			
			isDraging = false;
			drawingUtils.hideBalloon();
			if(toolsContainer) toolsContainer.selectTool("move");
			eventType = 'onEdit';
			chkEvent(eventType);
			drawMe();
			return true;
		};
		//LMap.on('mouseout', mouseUp);
		
		var needDisablePointerEvents = false;
		var mouseMove = function(ph)
		{
			if(needDisablePointerEvents) {
				drawingUtils.disablePointerEvents(true);
				needDisablePointerEvents = false;
			}
			if(ph.attr) ph = ph.attr;
			var latlng = ph.latlng;
			var x = latlng.lng;
			if(x < -180) x += 360;
			if(editIndex != -1) {
				if(!onMouseUpID) onMouseUpID = gmxAPI.map.addListener('onMouseUp', mouseUp);
//				lastPoint = null;
				coords[editIndex] = [x, latlng.lat];
				if(editType === 'POLYGON') {
					if(editIndex == 0) coords[coords.length - 1] = coords[editIndex];
					else if(editIndex == coords.length - 1) coords[0] = coords[editIndex];
				}
				oBounds = gmxAPI.getBounds(coords);
			} else {
				lastPoint = {'x': x, 'y': latlng.lat};
				drawingUtils.hideBalloon();
			}
			repaint();
			skipClick = mousePressed;
		}

		var getItemDownType = function(ph)
		{
			var downType = getDownType(ph, coords, oBounds);
			return ('type' in downType ? downType : null);
		}
		//ret.itemMouseDown = itemMouseDown;
		var getTitle = function(downType) {
			var title = '';
			var ii = downType['num'];
			if(downType['type'] === 'node') {
				if(editType === 'LINESTRING') {
					title = gmxAPI.prettifyDistance(gmxAPI.geoLength({ type: "LINESTRING", coordinates: [coords.slice(0,ii+1)] }));
				} else if(editType === 'POLYGON') {
					title = getGeometryTitle({ type: "POLYGON", coordinates: [coords] });
				}
			} else if(downType['type'] === 'edge') {
				if(ii == 0 && editType === 'LINESTRING') return false;
				var p1 = coords[ii];
				var p2 = coords[(ii == 0 ? coords.length - 1 : ii - 1)];
				title = getGeometryTitle({ type: "LINESTRING", coordinates: [[[p1[0], p1[1]], [p2[0], p2[1]]]] });
			}
			return title;
		}

		var chkNodeEvents = function()			// события на SVG элементах
		{
			if(node['leaflet']) {
				needInitNodeEvents = false;
				layerGroup.on('mouseover', function(e) {
					mouseOverFlag = true;
					var downType = getDownType(e, coords, oBounds);
					var title = getTitle(downType);
					chkEvent('onMouseOver', title);
				});
				layerGroup.on('mouseout', function(e) {
					drawingUtils.hideBalloon();
					chkEvent('onMouseOut'); 
					mouseOverFlag = false;
				});
				mouseDownFunc = function(e) {
//console.log('mouseDownFunc:  ', isFinish, coords.length);
					initMove = null;
					if(!isFinish) return;
					downTime = new Date().getTime();
					var downType = getDownType(e, coords);
					if('type' in downType) {
						editIndex = downType['num'];
						var x = e.latlng.lng;
						var y = e.latlng.lat;
						if(x < -180) x += 360;
						if(downType['type'] === 'node') {
							if(coords[editIndex][0] > 0 && x < 0) x += 360;
							coords[editIndex] = [x, y];
						} else if(downType['type'] === 'edge') {
							if(editIndex == 0 && editType === 'LINESTRING') editIndex++;
							coords.splice(editIndex, 0, [x, y]);
							if(!onMouseUpID) onMouseUpID = gmxAPI.map.addListener('onMouseUp', mouseUp);
						}
						mousePressed = true;
						repaint();
						gmxAPI._cmdProxy('startDrawing');
						gmxAPI._drawing['activeState'] = true;
						if(!onMouseMoveID) onMouseMoveID = gmxAPI.map.addListener('onMouseMove', mouseMove);
						drawingUtils.hideBalloon();
						return true;
					}
					//mouseOverFlag = true;
				};
				drawAttr['mousedown'] = function(e) {
					//if(!onMouseMoveID) onMouseMoveID = gmxAPI.map.addListener('onMouseMove', mouseMove);
					//initMove = function() {
						mouseDownFunc(e);
					// }
				}

				var dblclick = function(downType)		// Удаление точки
				{
//console.log('dblclick1:  ', coords.length);
					if(downType.type !== 'node') return;
					var len = coords.length - 1;
					if(editType === 'POLYGON') {
						lastPoint = null;
						if(downType.num === 0) {
							//downType.num = len;
							coords[len] = coords[1];
						}
						if(len == 2) len = 0;
					} else if(editType === 'LINESTRING') {
//	console.log('dblclick1:  ', coords.length);
						drawingUtils.enablePointerEvents(false);
						ret.stopDrawing();
						if(len == 1) len = 0;
					}
					if(len == 0) {
						domObj.remove();
					} else {
						coords.splice(downType.num, 1);
						drawAttr['coords'] = coords;
						drawSVG(drawAttr);
					}
					mouseUp();

					mousePressed = false;
					lastPoint = null;
						editIndex = null;
//console.log('dblclick2:  ', coords.length, downType.num);
					
				};
				drawAttr['dblclick'] = function(e) {
					var downType = getDownType(e, coords);
//console.log('____________:  ', coords.length, downType.num);
					dblclick(downType);
				}
				var onFinish = function(downType)		// Удаление точки
				{
//console.log('onFinish:  ', coords.length);
					var len = coords.length - 1;
					lastPoint = null;
					isFinish = true;
					if(editType === 'POLYGON') {
						if(len > 1) {
							layerItems[2].options['skipLastPoint'] = true;
							coords.push(coords[0]);
							drawAttr['coords'] = coords;
							mouseUp();
							drawSVG(drawAttr);
							drawingUtils.enablePointerEvents();
							return;
						} else {
							len = 0;
						}
					} else if(editType === 'LINESTRING') {
						drawingUtils.enablePointerEvents(false);
						ret.stopDrawing();
						if(len == 1) len = 0;
					}
					if(len == 0) {
						domObj.remove();
					}
					mouseUp();
//console.log('onFinish2:  ', coords.length);
					mousePressed = false;
				};
				var clickArr = [];
				layerGroup.on('click', function(e) {
//console.log('click0:  ', skipClick, isFinish);
					if(skipClick) {
						skipClick = false;
						return;
					}
					mousePressed = false;
					var downType = getDownType(e, coords);

					gmxAPI._listeners.dispatchEvent('onClick', domObj, domObj);
					gmxAPI._listeners.dispatchEvent('onClick', gmxAPI.map.drawing, domObj);

					if(downType.type === 'node') {
						var len = coords.length - 1;
//console.log('click:  ', len, downType.num, isFinish);
						if(!isFinish) {
							if(downType.num === 0 || downType.num === len) onFinish(downType);
							return;
						}
						if(editType === 'LINESTRING') {		// Для LINESTRING Click на начальной и конечной точках
							var x = e.latlng.lng;
							if(x < -180) x += 360;
							var y = e.latlng.lat;
							editIndex = downType.num;
							if(editIndex === 0) {
								coords.reverse();
								editIndex = -1;
							} else if(editIndex === len) {
								editIndex = -1;
							}
							if(editIndex === -1) {
								isFinish = false;
								if(!onMouseMoveID) onMouseMoveID = gmxAPI.map.addListener('onMouseMove', mouseMove);
								if(!addItemListenerID) addItemListenerID = gmxAPI.map.addListener('onClick', addDrawingItem);
								gmxAPI._drawing['activeState'] = true;
								drawAttr['coords'] = coords;
								drawSVG(drawAttr);
								needDisablePointerEvents = true;	// после mouseMove отключить мышь на SVG
							} else {
								if(onMouseMoveID) gmxAPI.map.removeListener('onMouseMove', onMouseMoveID); onMouseMoveID = null;
							}
							return;
						}
					}
					mouseUp();
				});
			}
		}
		var getPos = function()
		{ 
			return {'x': oBounds.minX - pointSize, 'y': oBounds.maxY - pointSize};
		}
		
		var layerGroup = null;
		var layerItems = [];
		var drawTimerID = null;
		var drawMe = function()
		{
//console.log('drawMe:  ', gmxAPI.currPosition);	// repaint vbounds
			if(!node.leaflet) {
				if(drawTimerID) clearTimeout(drawTimerID);
				drawTimerID = setTimeout(drawMe, 200);
				return;
			}
			//coords = [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]];
			if(!layerGroup) {
				layerGroup = node.leaflet;
			}
			if(needInitNodeEvents) chkNodeEvents();

			drawAttr['layerGroup'] = layerGroup;
			drawAttr['layerItems'] = layerItems;
			drawAttr['lastPoint'] = lastPoint
			drawAttr['oBounds'] = oBounds, drawAttr['coords'] = coords;
			drawAttr['node'] = node;
			drawSVG(drawAttr);
		}

		var obj = gmxAPI.map.addObject(null, null, {'subType': 'drawingFrame', 'getPos': getPos, 'drawMe': drawMe});
		node = mapNodes[obj.objectId];
		obj.setStyle(regularDrawingStyle, hoveredDrawingStyle);

		// Проверка пользовательских Listeners
		var chkEvent = function(eType, out)
		{
			if(!mousePressed && gmxAPI.map.drawing.enabledHoverBalloon) {
				var st = (out ? out : false);
				propsBalloon.updatePropsBalloon(st);
			}
			gmxAPI._listeners.dispatchEvent(eType, domObj, domObj);
			gmxAPI._listeners.dispatchEvent(eType, gmxAPI.map.drawing, domObj);
		}

		var createDrawingObj = function()
		{
			domObj = createDOMObject(ret, props, propHiden);
			domObj.objectId = obj.objectId;
			domObj['stateListeners'] = obj['stateListeners'];
			node = mapNodes[obj.objectId];
			eventType = 'onAdd';
			obj.setStyle(regularDrawingStyle, hoveredDrawingStyle);
			if(editType === 'LINESTRING') obj.setLine([[0, 0], [0, 0]]);
			else obj.setRectangle(0, 0, 0, 0);
			//repaint();
		}
	
		// Добавление точки
		var addDrawingItem = function(ph)
		{
console.log('addDrawingItem_______:  ', ph);
			if(ph.attr) ph = ph.attr;
			var latlng = ph.latlng;
			var x = latlng.lng;
			if(x < -180) x += 360;
			var y = latlng.lat;
			eventType = 'onEdit';
			if (!coords) {				// Если нет coords создаем
				coords = [];
				lastPoint = {'x': x, 'y':y};
				createDrawingObj();
				gmxAPI._drawing['activeState'] = true;
				if(!onMouseMoveID) onMouseMoveID = gmxAPI.map.addListener('onMouseMove', mouseMove);
			}
			if (coords.length) {
				var point = gmxAPI._leaflet['LMap'].project(new L.LatLng(y, x));
				var pointBegin = gmxAPI._leaflet['LMap'].project(new L.LatLng(coords[0][1], coords[0][0]));
				var flag = (Math.abs(pointBegin.x - point.x) < pointSize && Math.abs(pointBegin.y - point.y) < pointSize);
				if (flag && editType === 'LINESTRING') editType = drawAttr['editType'] = 'POLYGON';

console.log('addDrawingItem0:  ', coords.length, flag, lastPoint);
				if(!flag) {
					var tp = coords[coords.length - 1];
					pointBegin = gmxAPI._leaflet['LMap'].project(new L.LatLng(tp[1], tp[0]));
					flag = (Math.abs(pointBegin.x - point.x) < pointSize && Math.abs(pointBegin.y - point.y) < pointSize);
				}
console.log('addDrawingItem:  ', coords.length, flag, lastPoint);
				if (flag) {
					if(!layerItems[0]) return;
					gmxAPI.map.removeListener('onMouseMove', onMouseMoveID); onMouseMoveID = null;
					gmxAPI.map.removeListener('onClick', addItemListenerID); addItemListenerID = null;
					gmxAPI._cmdProxy('stopDrawing');
					if(editType === 'POLYGON') coords.push([coords[0][0], coords[0][1]]);
					oBounds = gmxAPI.getBounds(coords);
					lastPoint = null;
					drawingUtils.enablePointerEvents(false);
					gmxAPI._drawing['activeState'] = false;
					
					repaint();
					if(toolsContainer) toolsContainer.selectTool("move");
					eventType = 'onFinish';
					chkEvent(eventType);

					finishTime = new Date().getTime();
					isFinish = true;
					return true;
				}
			}
			coords.push([x, y]);
			oBounds = gmxAPI.getBounds(coords);
			repaint();
			chkEvent(eventType);
			return true;
		};

		var repaint = function()
		{
			drawMe();
			if(domObj) {
				var type = editType;
				var geom = { 'type': type, 'coordinates': (editType === 'LINESTRING' ? coords : [coords]) };
				domObj.update(geom, text);
			}
			return false;
		}
		var zoomListenerID = gmxAPI._listeners.addListener({'eventName': 'onZoomend', 'func': function()
			{
				//drawingUtils.enablePointerEvents(editType === 'POLYGON' ? true : false);
				repaint();
			}
		});

		var ret = {
			'getItemDownType': getItemDownType
			,
			'chkZindex': function() {
				if(layerGroup) layerGroup.bringToFront();
			}
			,'remove': function() {
				chkEvent('onRemove');
				obj.remove();
				domObj.removeInternal();
				if(zoomListenerID) gmxAPI._listeners.removeListener(null, 'onZoomend', zoomListenerID); zoomListenerID = null;
			}
			,'isVisible': (props.isVisible == undefined) ? true : props.isVisible
			,
			'setVisible': function(flag) { 
				obj.setVisible(flag); 
				ret.isVisible = flag;
			}
			,'setText': function(newText) {
				text = props.text = newText;
				this.properties.text = text;
			}
			,
			'setStyle': function(regularStyle, hoveredStyle) {
				obj.setStyle(regularStyle, hoveredStyle);
				drawAttr['regularStyle'] = gmxAPI._leaflet['utils'].parseStyle(regularStyle, obj.objectId);
				drawAttr['hoveredStyle'] = gmxAPI._leaflet['utils'].parseStyle(hoveredStyle, obj.objectId);
				chkStyle(drawAttr, regularStyle, hoveredStyle);
				if(layerGroup) {
					layerGroup.setStyle(drawAttr['stylePolygon']);
					layerItems[2].setStyle(drawAttr['stylePoint']);
				}
			}
			,
			'getVisibleStyle': function() { return obj.getVisibleStyle(); }
			,
			'getStyle': function(removeDefaults) {
				return getStyle(removeDefaults, obj);
			}
			,
			'stopDrawing': function() {
				if(onMouseMoveID) gmxAPI.map.removeListener('onMouseMove', onMouseMoveID); onMouseMoveID = null;
				if(onMouseUpID) gmxAPI.map.removeListener('onMouseUp', onMouseUpID); onMouseUpID = null;
				if(addItemListenerID) gmxAPI.map.removeListener('onClick', addItemListenerID); addItemListenerID = null;
				obj.stopDrawing();
			}
		};

		ret.setVisible(ret.isVisible);

		if('_tools' in gmxAPI && 'standart' in gmxAPI._tools) {
			toolsContainer = gmxAPI._tools['standart'];
			toolsContainer.currentlyDrawnObject = ret;
		}
		
		if (coords)
		{
			if(coords.length == 1) coords = coords[0];
			if(editType === 'POLYGON') {
				if(coords.length && coords[0].length != 2) coords = coords[0];
			} else if(editType === 'LINESTRING') {
				//drawAttr['skipLastPoint'] = true;	// Проверить импорт
			}
			drawAttr['isExternal'] = true;
			lastPoint = null;
			oBounds = gmxAPI.getBounds(coords);
			createDrawingObj();
			//mouseOverFlag = true;
			setTimeout(repaint, 10);
			endDrawing();
		} else {
			addItemListenerID = gmxAPI.map.addListener('onClick', addDrawingItem);
		}
		return ret;
	}
	drawFunctions.LINESTRING = function(coords, props, propHiden)
	{
		return editObject(coords, props, 'LINESTRING', propHiden)
	}
	drawFunctions.POLYGON = function(coords, props, propHiden)
	{
		if (gmxAPI.isRectangle(coords)) return drawFunctions.FRAME(coords, props);
		return editObject(coords, props, 'POLYGON', propHiden)
	}
	drawFunctions.FRAME = function(coords, props, propHiden)
	{
		if (!props)
			props = {};

		var text = props.text;
		if (!text)
			text = "";

		var mapNodes = gmxAPI._leaflet['mapNodes'];					// Хэш нод обьектов карты - аналог MapNodes.hx
		var drawAttr = {
			'editType': 'FRAME'
			,
			'strokeStyle': {
				'color': 'rgba(0, 0, 255, 1)'
			}
			,
			'fillStyle': {
				'color': 'rgba(255, 255, 255, 0.8)'
			}
			,
			'fillStylePolygon': {
				'color': 'rgba(255, 255, 255, 0.3)'
			}
		};
		
		var ret = {};
		var domObj;
		var propsBalloon = (gmxAPI.map.balloonClassObject ? gmxAPI.map.balloonClassObject.propsBalloon : null);
		var toolsContainer = null;
		if('_tools' in gmxAPI && 'standart' in gmxAPI._tools) {
			toolsContainer = gmxAPI._tools['standart'];
			toolsContainer.currentlyDrawnObject = ret;
		}

		var x1, y1, x2, y2;
		var deltaX = 0;
		var deltaY = 0;
		var oBounds = null;
		var isDraging = false;
		var eventType = '';

		var itemDownType = 'BottomRight';		// угол на котором мышь
		var pSize = 8;
		var lineWidth = 3;
		var pointSize = pSize / 2;
		var pCanvas = null;
		var needInitNodeEvents = true;
		
		var chkNodeEvents = function()
		{
			if(node['leaflet']) {
				needInitNodeEvents = false;
				//obj.addListener('onMouseDown', itemMouseDown);
				layerGroup.on('mouseover', function(e) {
					mouseOverFlag = true;
				});
				layerGroup.on('mouseout', function(e) {
					if(propsBalloon) propsBalloon.updatePropsBalloon(false);
					if(!needMouseOver) {
						chkEvent('onMouseOut'); 
						needMouseOver = true;
					}
					mouseOverFlag = false;
				});
				layerGroup.on('click', function(e) {
					if(new Date().getTime() - downTime > 500) return;
					gmxAPI._listeners.dispatchEvent('onClick', domObj, domObj);
					gmxAPI._listeners.dispatchEvent('onClick', gmxAPI.map.drawing, domObj);
				});
			}
		}

		var layerGroup = null;
		var layerItems = [];
		var isMouseOver = false;
		var drawTimerID = null;
		
		var drawMe = function()
		{ 
			if(!node) return;
			if(!node.leaflet) {
				if(drawTimerID) clearTimeout(drawTimerID);
				drawTimerID = setTimeout(drawMe, 200);
				return;
			}
			//if(!node.leaflet) return;
			coords = [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]];
			if(!layerGroup) {
				layerGroup = node.leaflet;
				//layerGroup.on('mouseover', function(e) { isMouseOver = true; });
			}
			if(needInitNodeEvents) chkNodeEvents();
			drawAttr['mousedown'] = itemMouseDown;
			drawAttr['layerGroup'] = layerGroup;
			drawAttr['layerItems'] = layerItems;
			drawAttr['oBounds'] = oBounds, drawAttr['coords'] = coords;
			drawAttr['node'] = node;
			drawAttr['dblclick'] = function(e, attr)		// Удаление обьекта
			{
				ret.remove();
			};
			
			drawSVG(drawAttr);
		}
		
		var getPos = function() { return {'x': x1, 'y': y1}; }
		var obj = null;
		var node = null;
		
		var created = false;
		var addItemListenerID = null;
		var onMouseMoveID = null;
		var onMouseUpID = null;
		var downTime = 0;

		var getItemDownType = function(ph)
		{
			var downType = getDownType(ph, [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]], oBounds);
			return ('type' in downType ? downType : null);
		}
		var itemMouseDown = function(e, attr)
		{
			if(currentDOMObject && currentDOMObject.objectId != attr['id']) return;
			downTime = new Date().getTime();
			if(propsBalloon) propsBalloon.updatePropsBalloon(false);
			coords = [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]];
			var downType = getDownType(e, coords);
			if('type' in downType) {
				mousePressed = true;
				gmxAPI._cmdProxy('startDrawing');
				gmxAPI._drawing['activeState'] = true;
				if(!onMouseMoveID) onMouseMoveID = gmxAPI.map.addListener('onMouseMove', mouseMove);
				if(!onMouseUpID) onMouseUpID = gmxAPI.map.addListener('onMouseUp', mouseUp);
				var cnt = downType['num'];
				if(downType['type'] == 'edge') {
					if(cnt == 4) itemDownType = 'Left';
					else if(cnt == 2) itemDownType = 'Right';
					else if(cnt == 1) itemDownType = 'Top';
					else if(cnt == 3) itemDownType = 'Bottom';
				} else {
					if(cnt == 0) itemDownType = 'TopLeft';
					else if(cnt == 2) itemDownType = 'BottomRight';
					else if(cnt == 1) itemDownType = 'TopRight';
					else if(cnt == 3) itemDownType = 'BottomLeft';
				}
				return true;
			} else {
				return false;
			}
			return true;
		};
		
		var updatePos = function(x, y)
		{
			if(itemDownType === 'BottomRight') {
				if(y2 > y1) 		y = y1, y1 = y2, y2 = y, itemDownType = 'TopRight';
				else if(x1 > x2)	x = x1, x1 = x2, x2 = x, itemDownType = 'BottomLeft';
				else	x2 = x, y2 = y;
			}
			else if(itemDownType === 'TopRight') {
				if(y2 > y1) 		y = y1, y1 = y2, y2 = y, itemDownType = 'BottomRight';
				else if(x1 > x2) 	x = x1, x1 = x2, x2 = x, itemDownType = 'TopLeft';
				else	x2 = x, y1 = y;
			}
			else if(itemDownType === 'TopLeft') {
				if(y2 > y1) 		y = y1, y1 = y2, y2 = y, itemDownType = 'BottomLeft';
				else if(x1 > x2)	x = x1, x1 = x2, x2 = x, itemDownType = 'TopRight';
				else	x1 = x, y1 = y;
			}
			else if(itemDownType === 'BottomLeft') {
				if(y2 > y1)			y = y1, y1 = y2, y2 = y, itemDownType = 'TopLeft';
				else if(x1 > x2)	x = x1, x1 = x2, x2 = x, itemDownType = 'BottomRight';
				else	x1 = x, y2 = y;
			}
			else if(itemDownType === 'Top') {
				if(y2 > y1)			y = y1, y1 = y2, y2 = y, itemDownType = 'Bottom';
				else	y1 = y;
			}
			else if(itemDownType === 'Bottom') {
				if(y2 > y1)			y = y1, y1 = y2, y2 = y, itemDownType = 'Top';
				else	y2 = y;
			}
			else if(itemDownType === 'Right') {
				if(x1 > x2)			x = x1, x1 = x2, x2 = x, itemDownType = 'Left';
				else	x2 = x;
			}
			else if(itemDownType === 'Left') {
				if(x1 > x2)			x = x1, x1 = x2, x2 = x, itemDownType = 'Right';
				else	x1 = x;
			}
		};

//			obj = gmxAPI.map.addObject(null, null, {'subType': 'drawingFrame', 'getPos': getPos, 'drawMe': drawMe});
	//		obj.setStyle(regularDrawingStyle, hoveredDrawingStyle);
		var createDrawingItem = function()
		{
			obj = gmxAPI.map.addObject(null, null, {'subType': 'drawingFrame', 'getPos': getPos, 'drawMe': drawMe});
			obj.setStyle(regularDrawingStyle, hoveredDrawingStyle);
			domObj = createDOMObject(ret, props, propHiden);
			domObj.objectId = obj.objectId;
			domObj['stateListeners'] = obj['stateListeners'];
			node = mapNodes[obj.objectId];

			eventType = 'onAdd';
			obj.setStyle(regularDrawingStyle, hoveredDrawingStyle);
			obj.setRectangle(0, 0, 0, 0);
			repaint();
			obj.addListener('onMouseDown', itemMouseDown);
			created = true;
		}
		
		var mouseMove = function(ph)
		{
			if (!mousePressed) {
				mouseUp(ph);
				return true;
			}
		
			var x = ph.attr.latlng.lng;
			var y = ph.attr.latlng.lat;
			isDraging = true;
			updatePos(x, y);
			eventType = 'onEdit';
			//console.log('mouseMove ', itemDownType, x1, y1, x2, y2);
			if (!created) createDrawingItem();
			chkEvent(eventType);
			repaint();
			return true;
		};
		
		var mouseUp = function(ph)
		{
			mousePressed = false;
			gmxAPI.map.removeListener('onMouseUp', onMouseUpID);
			onMouseUpID = null;
			gmxAPI._cmdProxy('stopDrawing');
			if(onMouseMoveID) gmxAPI.map.removeListener('onMouseMove', onMouseMoveID);
			//console.log('onMouseUp: onMouseMoveID ', x1, y1, x2, y2);
			onMouseMoveID = null;
			gmxAPI._drawing['activeState'] = false;
			
			isDraging = false;
			if(propsBalloon) propsBalloon.updatePropsBalloon(false);
			gmxAPI._setToolHandler("onMouseDown", null);
			if(toolsContainer) toolsContainer.selectTool("move");
			if(domObj) domObj.triggerInternal("onMouseUp");
			chkEvent('onFinish');
			return true;
		};
		
		// Проверка пользовательских Listeners FRAME
		var chkEvent = function(eType, out)
		{
			if(gmxAPI.map.drawing.enabledHoverBalloon && propsBalloon) {
				var st = (out ? out : false);
				propsBalloon.updatePropsBalloon(st);
			}
			gmxAPI._listeners.dispatchEvent(eType, domObj, domObj);
			gmxAPI._listeners.dispatchEvent(eType, gmxAPI.map.drawing, domObj);
			//console.log('chkEvent:  ', eType);
		}
	
		// Получить текст балуна в зависимости от типа geometry
		var getBalloonText = function(downType)
		{
			var out = '';
			if(!isDraging && propsBalloon) {
				if(gmxAPI.map.drawing.enabledHoverBalloon) {
					var geom = { type: "POLYGON", coordinates: [[[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]] };
					if(downType['type'] == 'edge') {
						var cnt = downType['num'];
						if(cnt == 4) geom = { type: "LINESTRING", coordinates: [[[x1, y1], [x1, y2]]] };		// Left
						else if(cnt == 2) geom = { type: "LINESTRING", coordinates: [[[x2, y1], [x2, y2]]] };	// Right
						else if(cnt == 1) geom = { type: "LINESTRING", coordinates: [[[x1, y1], [x2, y1]]] };	// Top
						else if(cnt == 3) geom = { type: "LINESTRING", coordinates: [[[x1, y2], [x2, y2]]] };	// Bottom
					}
					out = getGeometryTitle(geom);
				}
			}
			return out;
		}

		var repaint = function()
		{
			//console.log('repaint:  ', domObj);
			if(domObj) {
				var geom = { type: "POLYGON", coordinates: [[[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]] };
				domObj.update(geom, text);
			}
			drawMe();
		}
		var zoomListenerID = gmxAPI._listeners.addListener({'eventName': 'onZoomend', 'func': repaint });
		var positionChangedID = gmxAPI.map.addListener('positionChanged', repaint);
		ret.chkZindex = function()
		{
			if(layerGroup) layerGroup.bringToFront();
		}
		ret.remove = function()
		{
			//eventType = 'onRemove';
			chkEvent('onRemove');
			obj.remove();
			domObj.removeInternal();
			if(zoomListenerID) gmxAPI._listeners.removeListener(null, 'onZoomend', zoomListenerID); zoomListenerID = null;
			if(positionChangedID) gmxAPI.map.removeListener('positionChanged', positionChangedID); positionChangedID = null;
		}
		ret.stopDrawing = function() {
			if(onMouseMoveID) gmxAPI.map.removeListener('onMouseMove', onMouseMoveID); onMouseMoveID = null;
			if(onMouseUpID) gmxAPI.map.removeListener('onMouseUp', onMouseUpID); onMouseUpID = null;
			if(addItemListenerID) gmxAPI.map.removeListener('onMouseDown', addItemListenerID); addItemListenerID = null;
			gmxAPI._cmdProxy('stopDrawing');
		}

		ret.getItemDownType = getItemDownType;
		ret.isVisible = (props.isVisible == undefined) ? true : props.isVisible;
		ret.setVisible = function(flag)
		{ 
			obj.setVisible(flag); 
			ret.isVisible = flag;
		}
		ret.getStyle = function(removeDefaults) { return getStyle(removeDefaults, obj); };
		ret.setStyle = function(regularStyle, hoveredStyle) {
			obj.setStyle(regularStyle, hoveredStyle);
			drawAttr['regularStyle'] = gmxAPI._leaflet['utils'].parseStyle(regularStyle, obj.objectId);
			drawAttr['hoveredStyle'] = gmxAPI._leaflet['utils'].parseStyle(hoveredStyle, obj.objectId);
			chkStyle(drawAttr, regularStyle, hoveredStyle);
			if(layerGroup) {
				layerGroup.setStyle(drawAttr['stylePolygon']);
				layerItems[1].setStyle(drawAttr['stylePoint']);
			} else {
				drawMe();
			}
		}
		
		var needMouseOver = true;
		ret.chkMouse = function(ph)
		{
			if(!mouseOverFlag) return false;
			coords = [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]];
			oBounds = gmxAPI.getBounds(coords);
			//console.log('chkMouse:  ', isMouseOver, ph.latlng);
			var downType = getDownType(ph, coords, oBounds);
			var flag = ('type' in downType ? true : false);
			if(flag) {
				//if(isMouseOver) {
				var txt = (mousePressed ? '' : getBalloonText(downType));
				chkEvent('onMouseOver', txt);
				//}
				needMouseOver = false;
			} else {
				if(!needMouseOver) {
					chkEvent('onMouseOut'); needMouseOver = true;
				}
			}	
			return flag;
		}
/*		ret.updateCoordinates = function(newCoords)
		{
			coords = newCoords;
			oBounds = gmxAPI.getBounds(coords);
			x1 = oBounds.minX; y1 = oBounds.maxY;	x2 = oBounds.maxX; y2 = oBounds.minY;
			repaint(10);
		}
*/
		if (coords)
		{
			oBounds = gmxAPI.getBounds(coords);
			x1 = oBounds.minX; y1 = oBounds.maxY;	x2 = oBounds.maxX; y2 = oBounds.minY;
			createDrawingItem();
			mouseUp();
			setTimeout(repaint, 10);
			endDrawing();
		} else {
			gmxAPI._cmdProxy('startDrawing');
			var setMouseDown = function(ph)
			{
				mousePressed = true;
				x1 = ph.attr.latlng.lng;
				y1 = ph.attr.latlng.lat;
				gmxAPI._cmdProxy('startDrawing');
				gmxAPI._drawing['activeState'] = true;
				onMouseMoveID = gmxAPI.map.addListener('onMouseMove', mouseMove);
				gmxAPI.map.removeListener('onMouseDown', addItemListenerID);
				addItemListenerID = null;
				//console.log('onMouseDown: onMouseMoveID ', x1, y1, x2, y2);
				return true;
			};
			addItemListenerID = gmxAPI.map.addListener('onMouseDown', setMouseDown);
			
			onMouseUpID = gmxAPI.map.addListener('onMouseUp', mouseUp);
		}
		return ret;
	}

	var activeListener = false;
	var zoomActive = false;
	drawFunctions.zoom = function()
	{
		gmxAPI._drawing['activeState'] = true;
		gmxAPI._drawing['BoxZoom'] = true;
		var toolsContainer = null;
		if('_tools' in gmxAPI && 'standart' in gmxAPI._tools) {
			toolsContainer = gmxAPI._tools['standart'];
		}
		gmxAPI._drawing['setMove'] = function() {
			gmxAPI._drawing['activeState'] = false;
			gmxAPI._drawing['BoxZoom'] = false;
			if(toolsContainer) toolsContainer.selectTool("move");
		}
/*
		return;
		var x1, y1, x2, y2;
		var rect;

		zoomActive = true;
		var onClick = function(attr) {
			if(!zoomActive) return false;
		
			var d = 10*gmxAPI.getScale(gmxAPI.map.getZ());
			if (!x1 || !x2 || !y1 || !y2 || ((Math.abs(gmxAPI.merc_x(x1) - gmxAPI.merc_x(x2)) < d) && (Math.abs(gmxAPI.merc_y(y1) - gmxAPI.merc_y(y2)) < d)))
				gmxAPI.map.zoomBy(1, true);
			else
				gmxAPI.map.slideToExtent(Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2));
			//rect.remove();
			gmxAPI._listeners.dispatchEvent('onFinish', gmxAPI.map.drawing, null);
			if(toolsContainer) toolsContainer.selectTool("move");
			return true;
		};
		
		if(!activeListener) {
			gmxAPI.map.addListener('onClick', onClick);
			activeListener = true;
		}
*/		
		var ret = {
			stopDrawing: function()
			{
				//gmxAPI._setToolHandler("onMouseDown", null);
				//zoomActive = false;
				gmxAPI._drawing['activeState'] = false;
				gmxAPI._drawing['BoxZoom'] = false;
			}
		}
		return ret;
	}

	drawFunctions["move"] = function()
	{
		//gmxAPI._drawing['BoxZoom'] = false;
	}

	drawFunctions.POINT = function(coords, props, propHiden)
	{
		if (!props)
			props = {};

		var text = props.text;
		if (!text)
			text = "";
		var x, y;
		var obj = false;
		var balloon = false;
		var domObj;
		var isDrawing = true;
		var ret = {};
		var toolsContainer = null;
		if('_tools' in gmxAPI && 'standart' in gmxAPI._tools) {
			toolsContainer = gmxAPI._tools['standart'];
			toolsContainer.currentlyDrawnObject = ret;
		}

		// Проверка пользовательских Listeners POLYGON
		var chkEvent = function(eType, out)
		{
			//if(!mousePressed && gmxAPI.map.drawing.enabledHoverBalloon) {
			//	var st = (out ? out : false);
			//	propsBalloon.updatePropsBalloon(st);
			//}
			var flag = gmxAPI._listeners.dispatchEvent(eType, domObj, domObj);
			if(!flag) flag = gmxAPI._listeners.dispatchEvent(eType, gmxAPI.map.drawing, domObj);
/*			
			var eObj = (domObj.propHiden['multiObj'] ? domObj.propHiden['multiObj'] : domObj);
			var flag = gmxAPI._listeners.dispatchEvent(eType, eObj, eObj);
			if(!flag) flag = gmxAPI._listeners.dispatchEvent(eType, gmxAPI.map.drawing, eObj);
			//console.log('chkEvent:  ', eType, flag);
*/
			return flag;
		}

		ret.isVisible = (props.isVisible == undefined) ? true : props.isVisible;
		ret.stopDrawing = function()
		{
			//gmxAPI._cmdProxy('stopDrawing');
			if (!isDrawing)
				return;
			isDrawing = false;
			if (!coords)
			{
				if(addItemListenerID) gmxAPI.map.removeListener('onClick', addItemListenerID);
				addItemListenerID = null;
			/*
				gmxAPI.map.unfreeze();
				gmxAPI._sunscreen.setVisible(false);
				gmxAPI._setToolHandler("onClick", null);
				gmxAPI._setToolHandler("onMouseDown", null);
			*/
				//gmxAPI.map.clearCursor();
			}
		}

		ret.remove = function()
		{
			if (obj)
			{
				chkEvent('onRemove');
				obj.remove();
				if(balloon) balloon.remove();
				domObj.removeInternal();
			}
		}

		ret.setStyle = function(regularStyle, hoveredStyle) {}

		var done = function(xx, yy)
		{
			obj = gmxAPI.map.addObject(null, null, {'subType': 'drawing'});
			balloon = null;
			if(gmxAPI.map.balloonClassObject) {
				balloon = gmxAPI.map.balloonClassObject.addBalloon(true);	// Редактируемый балун (только скрывать)
			}

			gmxAPI.map.addListener('zoomBy', function() {
				if(balloon.isVisible) gmxAPI.setVisible(balloon.outerDiv, false);
			});
			gmxAPI.map.addListener('onMoveEnd', function() {
				if(balloon.isVisible) {
					gmxAPI.setVisible(balloon.outerDiv, true);
					balloon.reposition();
				}
				upCallback();
			});

			var updateDOM = function()
			{
				xx = gmxAPI.chkPointCenterX(xx);
				domObj.update({ type: "POINT", coordinates: [xx, yy] }, text);
			}

			ret.setText = function(newText)
			{
				if(!balloon) return;
				text = newText;
				input.value = newText;
				balloon.updatePropsBalloon(newText);
				updateText();
			}

			ret.setVisible = function(flag)
			{
				ret.isVisible = flag;
				obj.setVisible(ret.isVisible);
				if(balloon) balloon.setVisible(ret.isVisible && balloonVisible);
			}
			ret.balloon = balloon;
			ret.getVisibleStyle = function() { return obj.getVisibleStyle(); };
			ret.getStyle = function(removeDefaults) { return getStyle(removeDefaults, obj); };

			var position = function(x, y)
			{
				xx = x;
				yy = y;
				//gmxAPI._cmdProxy('setAPIProperties', { 'obj': obj, 'attr':{'type':'POINT', 'isDraging': isDragged} });
				obj.setPoint(xx, yy);
				if(balloon) balloon.setPoint(xx, yy, isDragged);
				updateDOM();
			}
/*			ret.updateCoordinates = function(newCoords)
			{
				position(newCoords[0], newCoords[1]);
			}
*/
			var apiBase = gmxAPI.getAPIFolderRoot();

			obj.setStyle(
				{ 
					marker: { image: apiBase + "img/flag_blau1.png", dx: -6, dy: -36 },
					label: { size: 12, color: 0xffffc0 }
				},
				{ 
					marker: { image: apiBase + "img/flag_blau1_a.png", dx: -6, dy: -36 },
					label: { size: 12, color: 0xffffc0 }
				}
			);

			var startDx = 0, startDy = 0, isDragged = false;
			var clickTimeout = false;
			var needMouseOver = true;

			obj.setHandlers({
				"onClick": function()
				{
					if(domObj.stateListeners['onClick'] && chkEvent('onClick')) return;	// если установлен пользовательский onClick возвращающий true выходим
					if (clickTimeout)
					{
						clearTimeout(clickTimeout);
						clickTimeout = false;
						ret.remove();
					}
					else
					{
						clickTimeout = setTimeout(function() { clickTimeout = false; }, 500);
						if(balloon) {
							balloonVisible = !balloon.isVisible;
							balloon.setVisible(balloonVisible);
							if (balloonVisible)
								setHTMLVisible(true);
							else
							{
								gmxAPI.hide(input);
								gmxAPI.hide(htmlDiv);
							}
						}
					}
					return true;
				}
				,"onMouseOver": function()
				{
					if(!isDragged && needMouseOver) {
						chkEvent('onMouseOver');
						needMouseOver = false;
					}
				}
				,"onMouseOut": function()
				{
					if(!isDragged && !needMouseOver) {
						chkEvent('onMouseOut');
						needMouseOver = true;
					}
				}
			});

			var dragCallback = function(x, y)
			{
				position(x, y);
				chkEvent('onEdit');
			}
			var downCallback = function(x, y)
			{
				x = gmxAPI.chkPointCenterX(x);
				isDragged = true;
				if(balloon) {
					if(balloon.outerDiv.style.pointerEvents != 'none') {
						balloon.outerDiv.style.pointerEvents = 'none';
					}
				}
			};
			var upCallback = function()
			{
				if(balloon) {
					if(balloon.outerDiv.style.pointerEvents != 'auto') {
						balloon.outerDiv.style.pointerEvents = 'auto';
					}
				}
				isDragged = false;
				chkEvent('onFinish');
			}
			
			gmxAPI._listeners.addListener({'eventName': 'onZoomend', 'func': upCallback });
			obj.enableDragging(function(x, y, o, data)
			{
				dragCallback(x, y);
				gmxAPI._drawing['activeState'] = true;
			}
			, function(x, y, o, data)
			{
				downCallback(x, y);
			}
			, function(o)
			{
				//chkEvent('onFinish');
				gmxAPI._drawing['activeState'] = false;
				upCallback();
			});

			if(balloon) {	// Это все касается балуна для маркера
				var htmlDiv = document.createElement("div");
				htmlDiv.onclick = function(event)
				{
					event = event || window.event;
					var e = gmxAPI.compatTarget(event);
					if (e == htmlDiv)
					{
						setHTMLVisible(false);
						input.focus();
					}
				}
				balloon.div.appendChild(htmlDiv);
				var input = document.createElement("textarea");
				input.style.backgroundColor = "transparent";
				input.style.border = 0;
				input.style.overflow = "hidden";
				var fontSize = 16;
				input.style.fontSize = fontSize + 'px';
				input.setAttribute("wrap", "off");
				input.value = text ? text : "";

				var updateText = function() 
				{ 
					var newText = input.value;
					var rows = 1;
					for (var i = 0; i < newText.length; i++) {
						if (newText.charAt(i) == '\n'.charAt(0)) rows += 1;
						var tt = 1;
					}
					input.rows = rows;
					var lines = newText.split("\n");
					var cols = 2;
					for (var i in lines)
						cols = Math.max(cols, lines[i].length + 3);
					input.cols = cols;
					input.style.width = cols * (fontSize - (gmxAPI.isIE ? 5: 6));
					text = newText;
					if(balloon) balloon.resize();
					updateDOM();
				};
				input.onkeyup = updateText;
				input.onblur = function()
				{
					setHTMLVisible(true);
				}
				input.onmousedown = function(e)
				{
					if (!e)
						e = window.event;
					if (e.stopPropagation)
						e.stopPropagation();
					else
						e.cancelBubble = true;
				}
				if(balloon) balloon.div.appendChild(input);

				var setHTMLVisible = function(flag)
				{
					gmxAPI.setVisible(input, !flag);
					gmxAPI.setVisible(htmlDiv, flag);
					if (flag)
						htmlDiv.innerHTML = (gmxAPI.strip(input.value) == "") ? "&nbsp;" : input.value;
					if(balloon) balloon.resize();
				}

				var balloonVisible = (text && (text != "")) ? true : false;
				setHTMLVisible(balloonVisible);

				/*
				var getEventPoint = function(event)
				{
					//var currPos = gmxAPI.currPosition || gmxAPI.map.getPosition();
					var currPos = gmxAPI.map.getPosition();
					var mapX = currPos['x'];
					var mapY = currPos['y'];
					var scale = gmxAPI.getScale(currPos['z']);
					var px = gmxAPI.eventX(event) - gmxAPI.contDivPos['x']; 
					var py = gmxAPI.eventY(event) - gmxAPI.contDivPos['y'];
					return {
						'x': gmxAPI.from_merc_x(mapX + (px - gmxAPI._div.clientWidth/2)*scale)
						,
						'y': gmxAPI.from_merc_y(mapY - (py - gmxAPI._div.clientHeight/2)*scale)
					};
				}
				balloon.outerDiv.onmousedown = function(event)
				{
					//gmxAPI._cmdProxy('startDrawing');
					//gmxAPI._cmdProxy('setAPIProperties', { 'obj': obj, 'attr':{'type':'POINT', 'isDraging': true} });
					var eventPoint = getEventPoint(event);
					downCallback(eventPoint['x'], eventPoint['y']);
					gmxAPI._startDrag(obj, dragCallback, upCallback);
					return false;
				}
				balloon.outerDiv.onmouseup = function(event)
				{
					//gmxAPI._cmdProxy('stopDrawing');
					//gmxAPI._cmdProxy('setAPIProperties', { 'obj': obj, 'attr':{'type':'POINT', 'isDraging': false} });
					gmxAPI._stopDrag();
					upCallback();
				}
				balloon.outerDiv.onmousemove = function(event)
				{
					if (!mousePressed) isDragged = false;
					if (isDragged)
					{
						var eventPoint = getEventPoint(event);
						position(startDx + eventPoint['x'], startDy + eventPoint['y']);
						gmxAPI.deselect();
						return false;
					}
				}*/
				var showFlag = false;
				gmxAPI._listeners.addListener({'level': -10, 'eventName': 'onZoomstart', 'func': function(attr) {
					showFlag = balloon.isVisible;
					balloon.setVisible(false);
				}});
				gmxAPI._listeners.addListener({'level': -10, 'eventName': 'onZoomend', 'func': function(attr) {
					balloon.setVisible(showFlag);
				}});
			}
			domObj = createDOMObject(ret, null, propHiden);
			domObj.objectId = obj.objectId;
			position(xx, yy);
			if(balloon) {
				balloon.setVisible(balloonVisible);
				updateText();
			}
			chkEvent('onAdd');

			ret.setVisible(ret.isVisible);
			chkEvent('onFinish');
		}

		var addItemListenerID = null;
		if (!coords)
		{
			gmxAPI._sunscreen.bringToTop();
			gmxAPI._sunscreen.setVisible(true);
			var apiBase = gmxAPI.getAPIFolderRoot();
			//gmxAPI.map.setCursor(apiBase + "img/flag_blau1.png", -6, -36);

			//gmxAPI._setToolHandler("onClick", function() 
			addItemListenerID = gmxAPI.map.addListener('onClick', function()
			{
				done(gmxAPI.map.getMouseX(), gmxAPI.map.getMouseY());
				if(toolsContainer) {
					toolsContainer.selectTool("move");
					if (gmxAPI.map.isKeyDown(16)) {
						toolsContainer.selectTool("POINT");
					}
				}
				ret.stopDrawing();
				return true;
			});
		}
		else {
			done(coords[0], coords[1]);
			endDrawing();
		}
		return ret;
	}

	var chkZindexTimer = null
	var drawing = {
		handlers: { onAdd: [], onEdit: [], onRemove: [] },
		mouseState: 'up',
		activeState: false,
		isEditable: true,
		endDrawing: endDrawing,
		stateListeners: {},
		setEditable: function(flag) { drawing.isEditable = flag; },
		addListener: function(eventName, func) { return gmxAPI._listeners.addListener({'obj': this, 'eventName': eventName, 'func': func}); },
		removeListener: function(eventName, id)	{ return gmxAPI._listeners.removeListener(this, eventName, id); },
		enabledHoverBalloon: true,
		enableHoverBalloon: function()
			{
				this.enabledHoverBalloon = true;
			}
		,
		disableHoverBalloon: function()
			{
				this.enabledHoverBalloon = false;
			}
		,				
		//props опционально
		addObject: function(geom, props, propHiden)
		{
			//console.log('ddddd : ' , propHiden , ' : ' , geom);
			if(!propHiden) propHiden = {};
			if(!props) props = {};
			if (geom.type.indexOf("MULTI") != -1)
			{
				if(!propHiden) propHiden = {};
				propHiden['multiFlag'] = true;
				for (var i = 0; i < geom.coordinates.length; i++)
					this.addObject(
						{ 
							type: geom.type.replace("MULTI", ""),
							coordinates: geom.coordinates[i]
						},
						props
					);
/*				
				var myId = gmxAPI.newFlashMapId();
				var fObj = {
					'geometry': geom
					,'objectId': myId
					,'properties': props
					,'propHiden':propHiden
					,'members': []
					,'forEachObject': function(callback) {
						if(!callback) return;
						for (var i = 0; i < this.members.length; i++) callback(this.members[i].domObj);
					}
					,'setStyle': function(regularStyle, hoveredStyle) {
						this.forEachObject(function(context) { context.setStyle(regularStyle, hoveredStyle); });
					}
					,'remove': function() {
						this.forEachObject(function(context) { context.remove(); });
						delete multiObjects[myId];
					}
					,'setVisible': function(flag) {
						this.forEachObject(function(context) { context.setVisible(flag); });
					}
					,'getStyle': function(flag) {
						return (this.members.length ? this.members[0].domObj.getStyle(flag) : null);
					}
					,'getGeometry': function() {
						var coords = [];
						this.forEachObject(function(context) { coords.push(context.getGeometry().coordinates); });
						this.geometry.coordinates = coords;
						return gmxAPI.clone(this.geometry);
					}
					,'updateCoordinates': function(newCoords) {
						if(newCoords.type) newCoords = newCoords.coordinates;	// Если это geometry берем только координаты
						var type = geom.type.replace("MULTI", "");
						this.geometry.coordinates = newCoords;
						var oldLen = fObj['members'].length;
						for (var i = newCoords.length; i < oldLen; i++)
						{
							fObj['members'][i].remove();
							fObj['members'].pop();
						}
						for (var i = 0; i < newCoords.length; i++)
						{
							if(i >= this['members'].length) {
								var o = drawFunctions[type](newCoords[i][0], props, propHiden);		// нужна обработка дырок в polygon обьекте
								fObj['members'].push(o);
							} else {
								fObj['members'][i].updateCoordinates(newCoords[i][0]);
							}
						}
					}
					,'getArea': function() {
						var res = 0;
						this.forEachObject(function(context) { res += context.getArea(); });
						return res;
					}
					,'getLength': function() {
						var res = 0;
						this.forEachObject(function(context) { res += context.getLength(); });
						return res;
					}
					,'getCenter': function() {
						var centers = [];
						this.forEachObject(function(context) {
							centers.push(context.getCenter());
						});
						var res = null;
						if(centers.length) {
							res = [0, 0];
							for (var i = 0; i < centers.length; i++) {
								res[0] += centers[i][0];
								res[1] += centers[i][1];
							}
							res[0] /= centers.length;
							res[1] /= centers.length;
						}
						return res;
					}
					,stateListeners: {}
					,addListener: function(eventName, func) {
						return gmxAPI._listeners.addListener({'obj': this, 'eventName': eventName, 'func': func});
					}
					,removeListener: function(eventName, id) {
						return gmxAPI._listeners.removeListener(this, eventName, id);
					}
				};
				multiObjects[myId] = fObj;
				propHiden['multiObj'] = fObj;
				var type = geom.type.replace("MULTI", "");
				for (var i = 0; i < geom.coordinates.length; i++)
				{
					var o = drawFunctions[type](geom.coordinates[i], props, propHiden);
					fObj['members'].push(o);
				}
				return fObj;
				*/
			}
			else
			{
				var o = drawFunctions[geom.type](geom.coordinates, props, propHiden);
				//gmxAPI._tools['standart'].selectTool("move");
				return o.domObj;
			}
		},
		
		//поддерживаются events: onAdd, onRemove, onEdit
		//onRemove вызывается непосредственно ПЕРЕД удалением объекта
		//для FRAME поддерживается event onMouseUp - завершение изменения формы рамки
		setHandler: function(eventName, callback)
		{
			if (!(eventName in this.handlers)) 
				this.handlers[eventName] = [];
				
			this.handlers[eventName].push(callback);
		},
		setHandlers: function(handlers)
		{
			for (var eventName in handlers)
				this.setHandler(eventName, handlers[eventName]);
		},
		forEachObject: function(callback)
		{
			if(!callback) return;
			for (var id in objects) {
				var cObj = objects[id];
				if(cObj.geometry) callback(cObj);
			}
/*			
			for (var id in objects) {
				var cObj = objects[id];
				if(cObj.geometry && !cObj.propHiden['multiFlag']) callback(cObj);
			}
			for (var id in multiObjects) {
				var cObj = multiObjects[id];
				if(cObj.geometry) callback(cObj);
			}*/
		}
		,
		tools: { 
			setVisible: function(flag) 
			{ 
				if('toolsAll' in gmxAPI.map && 'standartTools' in gmxAPI.map.toolsAll) gmxAPI.map.toolsAll.standartTools.setVisible(flag);
			}
		}
		,
		addTool: function(tn, hint, regularImageUrl, activeImageUrl, onClick, onCancel)
		{
			var ret = gmxAPI.map.toolsAll.standartTools.addTool(tn, {
				'key': tn,
				'activeStyle': {},
				'regularStyle': {},
				'regularImageUrl': regularImageUrl,
				'activeImageUrl': activeImageUrl,
				'onClick': onClick,
				'onCancel': onCancel,
				'hint': hint
			});
			return ret;
		}
		, 
		removeTool: function(tn)
		{
			if(this.tools[tn]) {
				gmxAPI.map.toolsAll.standartTools.removeTool(tn);
			}
		}
		,
		selectTool: function(toolName)
		{
			gmxAPI._tools['standart'].selectTool(toolName);
		}
		,
		getHoverItem: function(attr)
		{
			//console.log('chkMouseHover ' );
			for (var id in objects) {
				var cObj = objects[id];
				if('getItemDownType' in cObj && cObj['getItemDownType'].call(cObj, attr, cObj.getGeometry())) {
					return cObj;
				}
			}
			return null;
		}
		,
		chkMouseHover: function(attr, fName)
		{
//console.log('chkMouseHover:  ', fName, mouseOverFlag);
			if(!mouseOverFlag) return;
			if(!fName) fName = 'chkMouse';
			if(!mousePressed || attr['evName'] == 'onMouseDown') {
				for (var id in objects) {
					var cObj = objects[id];
					if(fName in cObj && cObj[fName].call(cObj, attr)) return true;
				}
			}
			return false;
		}
		,
		chkZindex: function(pid)
		{
			if(chkZindexTimer) clearTimeout(chkZindexTimer);
			chkZindexTimer = setTimeout(function()
			{
				chkZindexTimer = null;
				for (var id in objects) {
					var cObj = objects[id];
					if('chkZindex' in cObj) cObj.chkZindex();
				}
			}, 10);
		}
	}

	//расширяем namespace
    gmxAPI._drawFunctions = drawFunctions;
    gmxAPI._drawing = drawing;

})();