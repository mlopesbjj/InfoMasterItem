var app;
define( ["qlik", "jquery", "text!./lib/css/style.css"], 
function ( qlik, $, cssContent ) {
	'use strict';
 	debugger;
	app = qlik.currApp(this);
	app.clearAll();
	$( "<style>" ).html( cssContent ).appendTo( "head" );
	function createRows ( rows, dimensionInfo ) {
		var html = "";
		rows.forEach( function ( row ) {
			html += '<tr>';
			row.forEach( function ( cell, key ) {
				if ( cell.qIsOtherCell ) {
					cell.qText = dimensionInfo[key].othersLabel;
				}
				html += "<td ";
				if ( !isNaN( cell.qNum ) ) {
					html += "class='numeric'";
				}
				html += '>' + cell.qText.replace(">", "<").replace("<", ">") + '</td>';
			} );
			html += '</tr>';
		} );
		return html;
	}

	return {
		initialProperties: {
			qHyperCubeDef: {
				qDimensions: [],
				qMeasures: [],
				qInitialDataFetch: [{
					qWidth: 10,
					qHeight: 50
				}]
			}
		},
		definition: {
			type: "items",
			component: "accordion",
			items: {
				dimensions: {
					uses: "dimensions",
					min: 1
				}
			}
		},
		snapshot: {
			canTakeSnapshot: true
		},
		paint: function ( $element, layout ) {
			var html = "<table id='tabledata' style='border-collapse: collapse; width: 100%;' border='1'><thead><tr>", self = this,
				hypercube = layout.qHyperCube,
				rowcount = hypercube.qDataPages[0].qMatrix.length,
				colcount = hypercube.qDimensionInfo.length + hypercube.qMeasureInfo.length;
				html += "<p>1. Press Download button to take exemple data.xls file.<p>"
				html += "<p>2. After complete the files, create a script with data file. </p>"
				html += "<p style='color: red;'>Important: The columns in the table must be in the same order as the columns in the data.xls file.<p>"
				html += "<p>3. To create dimensions or measures press the Process button<p>"
				html += "<p>4. To clear dimensions or mesuares press Clear button.<p>"
				html += "<p>The clear button will delete only dimensions or measures created by the extension.<p><br>"
				html += "<a href='#' class='downloadfile' download>"
				html += "<div class='bootstrap_inside'><button class='btn btn-primary btn-block'>Download</button><div>"
				html += "</a> <br>"

			//render titles
			hypercube.qDimensionInfo.forEach( function ( cell ) {
				html += '<th>' + cell.qFallbackTitle + '</th>';
			} );
			html += "</tr></thead><tbody>";
			//render data
			html += createRows( hypercube.qDataPages[0].qMatrix, hypercube.qDimensionInfo );
			html += "</tbody></table>";
			html += "<br><div>"
			html += "<input type='checkbox' class='chkdimension'>" 
			html += "<label for='chkdimen' style='font-size: 18px;'> Dimension</label><br>"
			html += "<input type='checkbox' class='chkmeasure'>"
			html += "<label for='chkmeasure' style='font-size: 18px;'> Measure</label><br>"
			// html += "<input type='checkbox' class='chkdrill'>"
			// html += "<label for='chkdrill' style='font-size: 18px;'> Drill-Down</label>"
			html += "</div><br>"
			html += "<div><table style='width: 20%;'><tbody><tr>"
			html += "<td style='padding: 1px;'><div class='bootstrap_inside'><button class='btn btn-primary btn-block dataprocess'>Process</button></div></td>"
			html += "<td style='padding: 1px;'><div class='bootstrap_inside'><button class='btn btn-danger btn-block dataclear'>Clear</button></div></td>"
			html += "</tr></tbody></table></div>"

			$element.html( html );
			$element.find( ".downloadfile" ).on( "click", function (e) {
				e.preventDefault()
				window.open('/Extensions/InfoMasterItem/csv/data.xls')
				//window.open('/Extensions/InfoMasterItem/csv/dimension.xls')
			});

			$element.find( ".dataprocess" ).on( "click", function (e) {
				var lret = false;
				if ($('.chkdimension').is(':checked')) {
					if (processdimension()) {
						lret = true;
					}
				};
				if ($('.chkmeasure').is(':checked')) {
					if (processmeasure()) {
						lret = true;
					}
				};
				// if ($('.chkdrill').is(':checked')) {
				// 	if (processdrill()) {
				// 		lret = true;
				// 	}
				// };


				if (lret) {
					alert("Process finished!")
				}

			});

			$element.find( ".dataclear" ).on( "click", function (e) {
				var lret = false;
				if ($('.chkdimension').is(':checked')) {
					if (cleardimension()) {
						lret = true;
					}
				};
				if ($('.chkmeasure').is(':checked')) {
				 	if (clearmeasure()) {
						lret = true;
					}
				};
			// 	if ($('.chkdrill').is(':checked')) {
			// 		if (cleardrill()) {
			// 		   lret = true;
			// 	   }
			//    };
			   if (lret) {
					alert("Process finished!")
				};

			});

			function processdimension() {
				var tabledimen = jQuery('#tabledata tr')
				var lret = false;
				for (var nLine=1; nLine < tabledimen.length; nLine++ ) {
					var aCell = tabledimen[nLine];
					if (aCell.children[0].innerText.trim().toUpperCase() === "DIMENSION" && aCell.children[1].innerText.trim() != "-") {
						lret = true;
						app.model.engineApp.createDimension({
							qProp: {
								qInfo: {
									qId: "",
									qType: "dimension",
									qName: aCell.children[1].innerText.trim().replace("<", ">").replace(">", "<"),
									qIsSemantic: false
								},
								qDim: {
									qGrouping: "N",
									qFieldDefs: [aCell.children[1].innerText.trim().replace("<", ">").replace(">", "<")],
									qFieldLabels: [aCell.children[1].innerText.trim().replace("<", ">").replace(">", "<")],
									qLabelExpression: "'" + aCell.children[2].innerText.trim().replace("<", ">").replace(">", "<") + "'"
								},
								qMetaDef: {"title":aCell.children[1].innerText.trim().replace("<", ">").replace(">", "<"), "tags":["#d_infodati_"+aCell.children[1].innerText.trim().replace("<", ">").replace(">", "<")], "description": aCell.children[4].innerText.trim().replace("<", ">").replace(">", "<")}
							}
						});
					}
				}
				return lret
			};

			function processmeasure() {
				var tablemeasure = jQuery('#tabledata tr')
				var lret = false;
				for (var nLine=1; nLine < tablemeasure.length; nLine++ ) {
					var aCell = tablemeasure[nLine];
					if (aCell.children[0].innerText.trim().toUpperCase() === "MEASURE" && aCell.children[1].innerText.trim() != "-") {
						lret = true;
						app.model.engineApp.createMeasure(
							{
								qProp: {
									qInfo: {
										qId: "",
										qType: "measure",
										qName: aCell.children[1].innerText.trim().replace("<", ">").replace(">", "<"),
										qIsSemantic: false
									},
									qMeasure: {
										qLabel: "",
										qDef: aCell.children[3].innerText.trim().replace("<", ">").replace(">", "<"),
										qGrouping: "N",
										qExpressions: [aCell.children[1].innerText.trim().replace("<", ">").replace(">", "<")],
										qActiveExpression: 0,
										qLabelExpression: aCell.children[2].innerText.trim()==="-" ? "" : "'" + aCell.children[2].innerText.trim().replace("<", ">").replace(">", "<") + "'",
										qNumFormat: {
											qType: 0,
											qnDec: 0,
											qUseThou: 0,
											qFmt: "AUTOMATIC",
											qDec: "",
											qThou: ""
										}
									},
									qMetaDef: {"title": aCell.children[1].innerText.trim().replace("<", ">").replace(">", "<"), "tags":["#m_infodati_"+aCell.children[1].innerText.trim().replace("<", ">").replace(">", "<")], "description": aCell.children[4].innerText.trim() != "-" ? aCell.children[4].innerText.trim().replace("<", ">").replace(">", "<") : ""}
								}
							});
					}
				}
				return lret;
			};

			function clearmeasure() {
				var xret = app.model.engineApp.createSessionObject({
					qMeasureListDef: {
						qType: 'measure',
						qData: {
								info: '/qDimInfos'
						},
						qMeta: {}
					},
					qInfo: { qId: "MeasureList", qType: "MeasureList" }
				}).then(function (list) { 
						return list.getLayout().then(
							function (layout) {
								var xret = layout.qMeasureList.qItems;
									for (var i=0; i < layout.qMeasureList.qItems.length; i++) {
									if (xret[i].qMeta.tags.length > 0) {
										if (xret[i].qMeta.tags[0].substring(0, 12) === "#m_infodati_") {
											app.model.engineApp.destroyMeasure(xret[i].qInfo.qId);
										}
									}
								}
							});
				});
				return xret;
			};

			function cleardimension() {
				var xret = app.model.engineApp.createSessionObject({
					qDimensionListDef: {
						qType: 'dimension',
						qData: {
								info: '/qDimInfos'
						},
						qMeta: {}
					},
					qInfo: { qId: "DimensionList", qType: "DimensionList" }
				}).then(function (list) { 
						return list.getLayout().then(
							function (layout) {
								var xret = layout.qDimensionList.qItems;
								for (var i=0; i < layout.qDimensionList.qItems.length; i++) {
									if (xret[i].qMeta.tags.length > 0) {
										if (xret[i].qMeta.tags[0].substring(0, 12) === "#d_infodati_") {
											app.model.engineApp.destroyDimension(xret[i].qInfo.qId);
										}
									}
								}
							});
				});
				return xret;
			};
			return qlik.Promise.resolve();
		}
	};
});

