var viewer;

function loadTile(src) {
  if (!viewer) { return false;}
  viewer.open(src);

  $.getJSON(src,processImageApi);
}


function drawPalette(obj) {
  $('#swatches').remove();
  $("#palette").append("<div id='swatches'></div>");

  obj.palette.forEach(function(val){
    var c = val.color;
    $("#swatches").append("<div class='swatch' style='background-color: " + c +"'>" + c + "</div>");
  })

}

function supportsService(obj) {
  if (obj.service == undefined) {
    return false;
  }
  else if (Array.isArray(obj.service)) {
    console.log("TODO: Write me");
    for (var i = obj.service.length - 1; i >= 0; i--) {
       if (obj.service[i].profile === "http://palette.davidnewbury.com/vocab/iiifpal") {
        return obj.service[i];
       }
       return false;
     } 
    return false;
  }
  else if ($.isPlainObject(obj.service)) {
   return obj.service.profile === "http://palette.davidnewbury.com/vocab/iiifpal" ? obj.service : false;
  }
  return false;
}

function processGeneratedImageApi(obj) {
  var profile = supportsService(obj);
  console.log("obj", obj);
  if (!profile) {
    $("#generatable").text("NO");
  }
  else {
    $("#generatable").text("YES");
    drawPalette(profile);
    addDownloadLink(profile);
  }

}

function addDownloadLink(obj) {
  var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj));
  $('<p id="download_info_json"><a href="data:' + data + '" download="info.json">download generated info.json</a></p>').appendTo('#palette');

}


function processImageApi(obj) {
  $("#generatable_holder").remove();
  var service_exists = "..."
  var profile = supportsService(obj);
  if (!profile) {
    $("#service_exists").text("NO");
    $("#palette").append("<p id='generatable_holder'>Can a palette be generated?<span class='result' id='generatable'>...</span></p>")
    $.post("/",{url: $("#image_id input")[0].value},processGeneratedImageApi,"json");
  }
  else {
    $("#service_exists").text("YES");
    drawPalette(profile);
  }

}

function handleNewImage() {
  var ratio = viewer.source.aspectRatio;
  var width = $("#seadragon").width();
  $("#seadragon").height(width*(1/ratio));

}

function reloadImage(e) {
  if(e) {e.preventDefault();}
  $("#generatable_holder").remove();
  $('#swatches').remove();
  $("#download_info_json").remove();
  loadTile($("#image_id input")[0].value+"/info.json");  
}

function loadExample() {
  $("#image_id_url").val($(this).data("info"));
  $("#image_id").trigger("submit");
}

$(function() {
  $("#image_id").on("submit",reloadImage)
  $(".example").on("click", loadExample)

  if($("#seadragon").length) {
    viewer = OpenSeadragon({
          id: "seadragon",
          preserveViewport:    false,
          visibilityRatio:     1,
          minZoomLevel:        1,
          defaultZoomLevel:    1,
          sequenceMode:        false,
          showHomeControl:     false,
          showFullPageControl: false,
          showZoomControl:     false,

          prefixUrl:           "/images/openseadragon/"
        });
  }
  viewer.addHandler("open", handleNewImage);
  viewer.addHandler("resize", handleNewImage);
  reloadImage(false);
});