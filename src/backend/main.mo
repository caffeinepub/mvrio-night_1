import Array "mo:core/Array";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Set "mo:core/Set";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Admin artist principals (persistent after migration)
  let adminArtists = Set.empty<Principal>();

  // User profile type
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Internal Song type with mutable likedBy set
  type Song = {
    id : Nat;
    title : Text;
    artist : Text;
    albumArt : Storage.ExternalBlob;
    titleImage : Storage.ExternalBlob;
    audioFile : Storage.ExternalBlob;
    lyrics : Text;
    owner : Principal;
    likesCount : Nat;
    playCount : Nat;
    likedBy : Set.Set<Principal>;
  };

  // Public SongView type without likedBy set
  type SongView = {
    id : Nat;
    title : Text;
    artist : Text;
    albumArt : Storage.ExternalBlob;
    titleImage : Storage.ExternalBlob;
    audioFile : Storage.ExternalBlob;
    lyrics : Text;
    owner : Principal;
    likesCount : Nat;
    playCount : Nat;
  };

  module SongView {
    public func compare(song1 : SongView, song2 : SongView) : Order.Order {
      switch (Text.compare(song1.artist, song2.artist)) {
        case (#equal) { Text.compare(song1.title, song2.title) };
        case (order) { order };
      };
    };

    public func compareByTitle(song1 : SongView, song2 : SongView) : Order.Order {
      Text.compare(song1.title, song2.title);
    };
  };

  var nextSongId = 1;
  let songs = Map.empty<Nat, Song>();

  // New Playlist type includes persistent set tracking song IDs
  type Playlist = {
    name : Text;
    songs : Set.Set<Nat>;
  };

  // Public PlaylistView type for returning playlists
  type PlaylistView = {
    name : Text;
    songIds : [Nat];
  };

  // Persistent favorites and playlist state
  let favorites = Map.empty<Principal, Set.Set<Nat>>();
  let userPlaylists = Map.empty<Principal, Map.Map<Text, Playlist>>();
  let officialPlaylists = Map.empty<Text, Playlist>();

  public query ({ caller }) func checkAuthorization() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return false;
    };
    true;
  };

  public query ({ caller }) func isAdminArtist() : async Bool {
    adminArtists.contains(caller);
  };

  public shared ({ caller }) func addSong(
    title : Text,
    artist : Text,
    albumArt : Storage.ExternalBlob,
    titleImage : Storage.ExternalBlob,
    audioFile : Storage.ExternalBlob,
    lyrics : Text,
  ) : async Nat {
    if (not adminArtists.contains(caller)) {
      Runtime.trap("Unauthorized: Only admins/artists can add songs");
    };

    let song : Song = {
      id = nextSongId;
      title;
      artist;
      albumArt;
      titleImage;
      audioFile;
      lyrics;
      owner = caller;
      likesCount = 0;
      playCount = 0;
      likedBy = Set.empty<Principal>();
    };
    songs.add(nextSongId, song);
    nextSongId += 1;
    song.id;
  };

  public shared ({ caller }) func playSong(id : Nat) : async () {
    // No authorization check - accessible to all including guests
    switch (songs.get(id)) {
      case (null) { Runtime.trap("Song not found") };
      case (?song) {
        let updatedSong = { song with playCount = song.playCount + 1 };
        songs.add(id, updatedSong);
      };
    };
  };

  public shared ({ caller }) func toggleLikeSong(id : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like songs");
    };
    switch (songs.get(id)) {
      case (null) { Runtime.trap("Song not found") };
      case (?song) {
        let isLiked = song.likedBy.contains(caller);
        let newLikesCount = if (isLiked) {
          if (song.likesCount > 0) { song.likesCount - 1 } else { 0 };
        } else { song.likesCount + 1 };
        let updatedLikedBy = Set.empty<Principal>();

        song.likedBy.forEach(
          func(principal) {
            if (principal != caller) {
              updatedLikedBy.add(principal);
            };
          }
        );

        if (not isLiked) {
          updatedLikedBy.add(caller);
        };

        let updatedSong = { song with likesCount = newLikesCount; likedBy = updatedLikedBy };
        songs.add(id, updatedSong);
        newLikesCount;
      };
    };
  };

  func toSongView(song : Song) : SongView {
    {
      id = song.id;
      title = song.title;
      artist = song.artist;
      albumArt = song.albumArt;
      titleImage = song.titleImage;
      audioFile = song.audioFile;
      lyrics = song.lyrics;
      owner = song.owner;
      likesCount = song.likesCount;
      playCount = song.playCount;
    };
  };

  public query ({ caller }) func getSong(id : Nat) : async SongView {
    // No authorization check - accessible to all including guests
    switch (songs.get(id)) {
      case (null) { Runtime.trap("Song not found") };
      case (?song) { toSongView(song) };
    };
  };

  public query ({ caller }) func getAllSongs() : async [SongView] {
    // No authorization check - accessible to all including guests
    songs.values().toArray().map(toSongView).sort();
  };

  public query ({ caller }) func getAllSongsByTitle() : async [SongView] {
    // No authorization check - accessible to all including guests
    songs.values().toArray().map(toSongView).sort(SongView.compareByTitle);
  };

  public shared ({ caller }) func deleteSong(id : Nat) : async () {
    if (not adminArtists.contains(caller)) {
      Runtime.trap("Unauthorized: Only admins/artists can delete songs");
    };
    switch (songs.get(id)) {
      case (null) { Runtime.trap("Song not found") };
      case (_song) {
        songs.remove(id);
      };
    };
  };

  public query ({ caller }) func searchSongs(keyword : Text) : async [SongView] {
    // No authorization check - accessible to all including guests
    let filtered = songs.values().toArray().filter(
      func(song) {
        song.title.contains(#text keyword) or song.artist.contains(#text keyword);
      }
    );
    filtered.map(toSongView);
  };

  // Favorites (Persistent)
  public shared ({ caller }) func toggleFavorite(songId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can favorite songs");
    };

    if (not songs.containsKey(songId)) {
      Runtime.trap("Song not found");
    };

    let userFavorites = switch (favorites.get(caller)) {
      case (null) {
        let newFavorites = Set.empty<Nat>();
        favorites.add(caller, newFavorites);
        newFavorites;
      };
      case (?existing) { existing };
    };

    let isFavorite = userFavorites.contains(songId);

    if (isFavorite) {
      userFavorites.remove(songId);
    } else {
      userFavorites.add(songId);
    };

    isFavorite;
  };

  public query ({ caller }) func getFavorites() : async [Nat] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access favorites");
    };
    switch (favorites.get(caller)) {
      case (null) { [] };
      case (?favSet) { favSet.toArray() };
    };
  };

  public shared ({ caller }) func clearFavorites() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear favorites");
    };
    favorites.remove(caller);
  };

  // Playlists (Persistent)
  public shared ({ caller }) func createPlaylist(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create playlists");
    };

    let userPlaylistMap = switch (userPlaylists.get(caller)) {
      case (null) {
        let newMap = Map.empty<Text, Playlist>();
        userPlaylists.add(caller, newMap);
        newMap;
      };
      case (?existing) { existing };
    };

    if (userPlaylistMap.containsKey(name)) {
      Runtime.trap("Playlist with this name already exists");
    };

    userPlaylistMap.add(
      name,
      {
        name;
        songs = Set.empty<Nat>();
      },
    );
  };

  public shared ({ caller }) func addToPlaylist(playlistName : Text, songId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add to playlists");
    };

    if (not songs.containsKey(songId)) {
      Runtime.trap("Song not found");
    };

    switch (userPlaylists.get(caller)) {
      case (null) {
        Runtime.trap("Playlist not found");
      };
      case (?playlistMap) {
        switch (playlistMap.get(playlistName)) {
          case (null) { Runtime.trap("Playlist not found") };
          case (?playlist) {
            playlist.songs.add(songId);
          };
        };
      };
    };
  };

  public shared ({ caller }) func removeFromPlaylist(playlistName : Text, songId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove from playlists");
    };

    switch (userPlaylists.get(caller)) {
      case (null) {
        Runtime.trap("Playlist not found");
      };
      case (?playlistMap) {
        switch (playlistMap.get(playlistName)) {
          case (null) { Runtime.trap("Playlist not found") };
          case (?playlist) {
            if (not playlist.songs.contains(songId)) {
              Runtime.trap("Song not found in playlist");
            };
            playlist.songs.remove(songId);
          };
        };
      };
    };
  };

  func toPlaylistView(name : Text, playlist : Playlist) : PlaylistView {
    {
      name;
      songIds = playlist.songs.toArray();
    };
  };

  public query ({ caller }) func getUserPlaylists() : async [PlaylistView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their playlists");
    };

    let userPlaylistMap = switch (userPlaylists.get(caller)) {
      case (null) { Map.empty<Text, Playlist>() };
      case (?existing) { existing };
    };

    userPlaylistMap.toArray().map(func((name, playlist)) { toPlaylistView(name, playlist) });
  };

  public query ({ caller }) func getPlaylist(playlistName : Text) : async PlaylistView {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their playlists");
    };

    let userPlaylistMap = switch (userPlaylists.get(caller)) {
      case (null) { Map.empty<Text, Playlist>() };
      case (?existing) { existing };
    };

    switch (userPlaylistMap.get(playlistName)) {
      case (null) { Runtime.trap("Playlist not found") };
      case (?playlist) { toPlaylistView(playlistName, playlist) };
    };
  };

  public query ({ caller }) func getPlaylistDetails(playlistName : Text) : async [SongView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their playlists");
    };

    let userPlaylistMap = switch (userPlaylists.get(caller)) {
      case (null) { Map.empty<Text, Playlist>() };
      case (?existing) { existing };
    };

    switch (userPlaylistMap.get(playlistName)) {
      case (null) { [] };
      case (?playlist) {
        playlist.songs.toArray().map(
          func(songId) {
            switch (songs.get(songId)) {
              case (null) {
                Runtime.trap("Song not found in canister");
              };
              case (?song) { toSongView(song) };
            };
          }
        );
      };
    };
  };

  // Official playlists
  public shared ({ caller }) func createOfficialPlaylist(name : Text) : async () {
    if (not adminArtists.contains(caller)) {
      Runtime.trap("Unauthorized: Only admins/artists can create official playlists");
    };

    if (officialPlaylists.containsKey(name)) {
      Runtime.trap("Official playlist already exists");
    };

    officialPlaylists.add(
      name,
      {
        name;
        songs = Set.empty<Nat>();
      },
    );
  };

  public shared ({ caller }) func addToOfficialPlaylist(playlistName : Text, songId : Nat) : async () {
    if (not adminArtists.contains(caller)) {
      Runtime.trap("Unauthorized: Only admins/artists can add to official playlists");
    };

    if (not songs.containsKey(songId)) {
      Runtime.trap("Song not found");
    };

    switch (officialPlaylists.get(playlistName)) {
      case (null) {
        Runtime.trap("Playlist not found");
      };
      case (?playlist) {
        playlist.songs.add(songId);
      };
    };
  };

  public shared ({ caller }) func removeFromOfficialPlaylist(playlistName : Text, songId : Nat) : async () {
    if (not adminArtists.contains(caller)) {
      Runtime.trap("Unauthorized: Only admins/artists can remove from official playlists");
    };

    switch (officialPlaylists.get(playlistName)) {
      case (null) {
        Runtime.trap("Playlist not found");
      };
      case (?playlist) {
        if (not playlist.songs.contains(songId)) {
          Runtime.trap("Song not found in playlist");
        };
        playlist.songs.remove(songId);
      };
    };
  };

  public query ({ caller }) func getOfficialPlaylist(playlistName : Text) : async ?PlaylistView {
    // No authorization check - accessible to all including guests
    officialPlaylists.get(playlistName).map(func(playlist) { toPlaylistView(playlistName, playlist) });
  };

  public query ({ caller }) func getOfficialPlaylistDetails(playlistName : Text) : async [SongView] {
    // No authorization check - accessible to all including guests
    switch (officialPlaylists.get(playlistName)) {
      case (null) { [] };
      case (?playlist) {
        playlist.songs.toArray().map(
          func(songId) {
            switch (songs.get(songId)) {
              case (null) {
                Runtime.trap("Song not found in canister");
              };
              case (?song) { toSongView(song) };
            };
          }
        );
      };
    };
  };
};
