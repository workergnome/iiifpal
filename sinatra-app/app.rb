require 'sinatra/base'
require "sinatra/reloader" 
require "sinatra/json"
require "json"
require 'typhoeus'
require 'tempfile'
require "glorify"

require 'haml'
require "tilt/sass"

require "sinatra/link_header"

class MyApp < Sinatra::Base
  register Sinatra::Glorify


  configure :development do
    register Sinatra::Reloader
    set :show_exceptions, :after_handler
  end

  get "/" do
    @sample_service = File.read("#{File.dirname(__FILE__)}/examples/sample_service.md")
    haml :index, :layout => :layout
  end

  get '/css/site.css' do
    sass "css/site".to_sym
  end

  get '/vocab/context.json' do
    json JSON.parse(File.read("vocab/context.json"))
  end

  get '/vocab/iiifpal.?:format?' do
    vocab =  File.read('vocab/iiifpal.ttl')    
    case  params[:format]
    when nil
    when "ttl"
      content_type "text/turtle"
      vocab
    else
      next
    end
  end

  post '/' do
    unless params[:url]
      halt 400, "No URL Parameter Error"
    end
    data  = get_image_api(params[:url])
    image = get_image(data)
    palette = get_palette(image.path)
    data = add_service(data, palette)
    image.unlink
    json data
  end

  def get_image_api(url)
    response = Typhoeus.get("#{url}/info.json", followlocation: true)
    unless response.success?
      halt 400, "Invalid URL Error: #{response.body}"
    end
    begin
      data = JSON.parse(response.body)
    rescue JSON::ParserError
      halt 400, "JSON Parse Error"
    end
  end

  def get_palette(data)
    puts data
    response = Typhoeus.post(
      "0.0.0.0:8034/extract/roygbiv/css3",
      body: {
        file: File.open(data,"rb")
      }
    )
    return JSON.parse(response.body)
  end


  def add_service(data, palette = {})
    new_data = data.clone
    service_obj = {
      "@context" => "http://palette.davidnewbury.com/vocab/context.json",
      "profile"  => "http://palette.davidnewbury.com/vocab/iiifpal",
      "label"    => "Palette automatically generated with a IIIF Palette Server"
    }
    service_obj.merge!(palette)
    
    if data["service"].nil?
      new_data["service"] = service_obj
    elsif data["service"].is_a? Array
      new_data["service"] << service_obj
    elsif data["service"].is_a? Object
      new_data["service"] = [data["service"],service_obj]
    else
      halt 400, "I don't understand this service:  #{data["service"].to_json}"
    end
    new_data
  end


  def get_image(data)
    size = "full"
    if data["profile"][0] == "http://iiif.io/api/image/2/level0.json"
      unless data["sizes"].nil?
        smallest = data["sizes"].sort_by{|obj| obj["width"]}.first
        size = "#{smallest["width"]},"
      end
    else
      size = "300,"
    end

    quality = "default"

    if data["@context"] == "http://library.stanford.edu/iiif/image-api/1.1/context.json"
      quality = "native"
    end

    url = "#{data["@id"]}/full/#{size}/0/#{quality}.jpg"
    puts "Image URL: #{url}"
    response = Typhoeus.get(url, followlocation: true)
    file = Tempfile.new([data["@id"].split("/").last, ".jpg"])
    file.binmode
    file.write response.body
    file.close
    file
  end
end