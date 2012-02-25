# encoding: UTF-8
require 'sinatra'
require 'twitter'

require 'mongo'
require 'mongo_mapper'

Twitter.configure do |config|
	config.consumer_key = 'YOUR_CONSUMER_KEY'
	config.consumer_secret = 'YOUR_CONSUMER_SECRET'
	config.oauth_token = 'YOUR_ACCESS_TOKEN'
	config.oauth_token_secret = 'YOUR_ACCESS_SECRET'
end

# настраиваем Mongo
MongoMapper.database = 'users'

class User 
  include MongoMapper::Document

  key :screen_name
  key :profile_image_url
  key :followers_count
  key :statuses_count
  key :name
  key :friends_count
  key :lang
  key :url
  key :created_at, DateTime

  # id location notifications profile_image_url profile_image_url_https profile_background_color 
  # followers_count default_profile time_zone is_translator utc_offset profile_background_image_url 
  # statuses_count profile_link_color name friends_count listed_count protected 
  # profile_use_background_image profile_background_image_url_https contributors_enabled lang 
  # profile_text_color follow_request_sent description profile_sidebar_border_color show_all_inline_media 
  # url verified default_profile_image created_at profile_background_tile favourites_count id_str
  # following profile_sidebar_fill_color geo_enabled screen_name
end


get '/friends' do
  User.collection.remove # очищаем коллекцию

  friends = Twitter.friend_ids # получаем список всех друзей
  friend_ids = friends.ids

  friend_ids.each do |f| # проходимся по каждому и
    begin
      twi_user = Twitter.user(f) # получаем данные, отправляет запрос на сервер Twitter'а
      User.create( # заполняем поля
        :screen_name => twi_user.screen_name,
        :profile_image_url => twi_user.profile_image_url,
        :followers_count => twi_user.followers_count,
        :statuses_count => twi_user.statuses_count,
        :name => twi_user.name,
        :friends_count => twi_user.friends_count,
        :lang => twi_user.lang,
        :url => twi_user.url,
        :created_at => twi_user.created_at
      )
    rescue Exception => e # обрабатываем исключение
      puts e.message  
      puts e.backtrace.inspect
    end
  end

  @users = User.all # получаем всех сохраненных пользователей
  erb :friends # отображаем их
end

get '/' do
	erb :'index'
end

get '/json' do
  content_type :json
  users = []
  User.all.each do |u|
    users << {
      :name => u.screen_name,
      :full_name => u.name,
      :days => (DateTime.now-DateTime.strptime(u.created_at.to_s, '%Y-%m-%d')).to_i,
      :image => u.profile_image_url,
      :color => "#%06x" % (rand * 0xffffff),
      :created_at => u.created_at
    }
  end
  
  {
    nodes: users
  }.to_json
end