var EXAMPLES = [
  {
    id: 1, 
    image_id: "http://ids.lib.harvard.edu/ids/iiif/47208078", 
    caption: "Seated Bather, Harvard Art Museums"
  },
  {
    id: 2, 
    image_id: "http://scale.ydc2.yale.edu/iiif/4f227f08-7842-46cc-b05a-e3c6a4614cc1", 
    caption: "Joseph Mallord William Turner, 1775–1851, British, Dort or Dordrecht: The Dort packet-boat from Rotterdam becalmed, 1818, Oil on canvas, Yale Center for British Art, B1977.14.77, Paintings and Sculpture."
  },
  {
    id: 3, 
    image_id: "https://dlcs.io/iiif-img/wellcome/1/c9eafc55-4508-4cfb-8e3a-86b53655a3f0", 
    caption: "Orphan girls entering the refectory of a hospital. Oil painting by Frederick Cayley Robinson, 1915.  Wellcome Library no. 672831i."
  },
  {
    id: 4, 
    image_id: "http://iiif.bodleian.ox.ac.uk/iiif/image/af171ad9-b929-4d99-959b-5d02ab54f909", 
    caption: "[Watercolour Paintings of Burmese Life], Ms. Burm. a. 5, Image 7, Digital Bodleian."
  }
];

//------------------------------------------------------------------------------
var ExampleList = React.createClass({
  render: function() {
    var update = this.props.updateID;
    var examples = this.props.examples.map(function(example) {
        return ( <Example {...example} updateID={update} key={example.id} /> );
      });
    return (
      <div> 
        <label> Choose one of these examples: </label> 
        {examples}
      </div>
    )
  }
});


//------------------------------------------------------------------------------
var Example = React.createClass({
  handleClick: function(){
    this.props.updateID(this.props.image_id);
  },
  render: function() {
      var imgUrl = this.props.image_id + "/full/,100/0/native.jpg";
      
      return (
        <div className="example-wrapper">
          <img 
            className="example" 
            src={imgUrl} 
            data-info={this.props.image_id} 
            title={this.props.caption}
            onClick={this.handleClick} 
          />
          <div className="caption">
            {this.props.caption}
          </div>
        </div>
      );
  }
});

//------------------------------------------------------------------------------
var ExampleInput = React.createClass({

  getInitialState: function() {
    return {value: this.props.currentID};
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState({value: nextProps.currentID});
  },
  handleChange: function(e) {
    e.preventDefault();
    this.setState({value: e.target.value})
  },
  update: function() {
    this.props.updateID(this.state.value);
  },
  handleKeyDown: function(e) {
    if(e.keyCode == 13) {
      this.handleClick(e);
    }
  },
  handleClick: function(e) {
    e.preventDefault();
    this.update();
    return false;
  },
  render: function() {
    return (
      <div>      
        <label htmlFor="image_id_url">
          Or enter a IIIF Image API ID into the text box below:
        </label>
        <div className="inputHolder">
          <input 
            id="image_id_url" 
            type="text" 
            value={this.state.value} 
            onChange={this.handleChange}
            onBlur={this.update} 
          />
          <input type="submit" value="Generate" onClick = {this.handleClick} />
        </div>
      </div>
    );
  }
});

//------------------------------------------------------------------------------
var Palette = React.createClass({

  // Lifecycle Methods
  getInitialState: function() {
    return {
      serviceExists: false,
      paletteGenerating: false,
      computedInfoJson: false
    }
  },
  componentWillReceiveProps: function(nextProps) {
    if (nextProps.info != this.props.info) {
      if( this.serviceIsValid(nextProps.info)) {
        this.setState({
            paletteGenerating: false,
            serviceExists: true,
            computedInfoJson: null,
        });
      }
      else if (nextProps.info) {
        $.post("/",{url: nextProps.info["@id"]}, this.processGeneratedImageApi, "json");
        this.setState({
            paletteGenerating: true,
            serviceExists: false,
            computedInfoJson: null,
        });
      }
    }
  },

  // Custom Methods
  processGeneratedImageApi: function(data) {

    var paletteServiceInfo = this.serviceIsValid(data);

    // drawPalette(profile);
    // addDownloadLink(profile);
 
    this.setState({
      paletteGenerating: false, 
      computedInfoJson: data,
    })
  },

  isPaletteComputable: function () {
    return !!(this.state.computedInfoJson && this.serviceIsValid(this.state.computedInfoJson));
  },

  serviceIsValid: function (obj) {

    if (obj.service == undefined) {
      return false;
    }
    else if (Array.isArray(obj.service)) {
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
  },

  // Render
  render: function() {
    if (!this.props.info) {
      return false;
    }
    var _this = this;

    function renderComputable() {
      if (_this.state.serviceExists){ return false;}
      
      let str = "NO";
      if (_this.state.paletteGenerating) {str = "...";}
      else if (_this.isPaletteComputable()) {str = "YES";}

      return (
        <p>
          Is the palette Generatable?
          <span className="result">{str}</span>
        </p>
      );
    };

    function renderDownloadLink() {
      let obj = _this.state.computedInfoJson;
      if (!obj) {return false;}

      var data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj));
      return (
          <p id="download_info_json">
            <a href={data} download="info.json">download generated info.json</a>
          </p>
      );
    };

    function renderPalette() {
      let obj = false;

      if (_this.state.serviceExists) {
        obj = _this.serviceIsValid(_this.props.info)
      }
      else if (_this.state.computedInfoJson) {
        obj = _this.serviceIsValid(_this.state.computedInfoJson)
      }
      if (!obj){return false;}
      
      let swatches = obj.palette.map(function(val){
        let style = {backgroundColor: val.color};
        return (
          <div className='swatch' style={style} key={val.color}> 
            {val.color}
          </div>
        )  
      });

      return (
        <div id='swatches'>
          {swatches}
        </div>
        )
      
    }

    return (
      <div id="palette">
        <p>
          Does the service exist?
          <span className="result">{this.state.serviceExists ? "YES" : "NO"}</span>
        </p>
        {renderComputable()}
        {renderPalette()}
        {renderDownloadLink()}
      </div>
    )
  }
})


//------------------------------------------------------------------------------
var SeadragonViewer = React.createClass({

  // Lifecycle Methods
  componentDidMount: function() {
    this.viewer = OpenSeadragon({
      id: "seadragon",
      preserveViewport:    false,
      visibilityRatio:     1,
      minZoomLevel:        1,
      defaultZoomLevel:    1,
      sequenceMode:        false,
      showHomeControl:     false,
      showFullPageControl: false,
      showZoomControl:     false,
    });
    this.viewer.addHandler("open", this.modifyWindowSize);
    this.viewer.addHandler("resize", this.modifyWindowSize);
    this.viewer.open(this.props.image_id + "/info.json");
  },
   shouldComponentUpdate: function() {
    return false;
  },
  componentWillReceiveProps: function(nextProps) {
    if (nextProps.image_id != this.props.image_id) {
      this.viewer.open(nextProps.image_id + "/info.json");
    }
  },

  // Custom Methods
  modifyWindowSize: function() {
    var ratio = this.viewer.source.aspectRatio;
    var width = $("#seadragon").width();
    $("#seadragon").height(width*(1/ratio));
  },

  // Render
  render: function() {
    return (
       <div id="seadragon"></div>
    );
  }
});


//------------------------------------------------------------------------------
var Demo = React.createClass({

  // Lifecycle Methods
  getInitialState: function() {
    return {
      currentID: "http://evil-manifests.davidnewbury.com/iiif/images/garden-1",
      info: false
    }
  },
  componentDidMount: function() {
    this.getInfoJson();
  },
  componentDidUpdate: function(prevProps, prevState) {
    if (prevState.currentID != this.state.currentID) {
      this.getInfoJson();
    }
  },

  // Custom Methods
  getInfoJson: function() {
    this.setState({info: false});
    $.getJSON(this.state.currentID + "/info.json", this.processImageApi);
  },
  processImageApi(data) {
    this.setState({info: data});
  },
  updateID: function(id) {
    this.setState({currentID: id});
  },
  
  // Render
  render: function() {
    return ( 
      <div>
        <form id='image_id'>
          <ExampleList  examples={this.props.examples}   updateID={this.updateID} />
          <ExampleInput currentID={this.state.currentID} updateID={this.updateID} />
        </form>
        <Palette info={this.state.info} />
        <SeadragonViewer image_id={this.state.currentID} />
      </div>
    );
  }
});


//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

ReactDOM.render(
  <Demo examples={EXAMPLES} />,
  document.getElementById('demo')
);