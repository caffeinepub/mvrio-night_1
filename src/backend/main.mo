import Array "mo:core/Array";
import Map "mo:core/Map";
import Blob "mo:core/Blob";
import Text "mo:core/Text";
import List "mo:core/List";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Set "mo:core/Set";
import Storage "blob-storage/Storage";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Int "mo:core/Int";



actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  include MixinStorage();

  // Admin passcode for Hidden Admin Mode
  var adminPasscode : Text = "A1B2D3ABD";
  var maxMessagesPerConversation = 100;
  var hiddenAdminModeEnabled : Bool = false;

  type UserProfileRecord = {
    fullName : Text;
    userName : Text;
    dateOfBirth : Text;
    totalListeningTime : Nat; // In seconds
  };

  let userProfiles = Map.empty<Principal, UserProfileRecord>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfileRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfileRecord {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfileRecord) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func addListeningTime(seconds : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add listening time");
    };
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) {
        let updatedProfile : UserProfileRecord = {
          fullName = profile.fullName;
          userName = profile.userName;
          dateOfBirth = profile.dateOfBirth;
          totalListeningTime = profile.totalListeningTime + seconds;
        };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

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

  type Playlist = {
    name : Text;
    description : Text;
    titleImage : ?Storage.ExternalBlob;
    songs : List.List<Nat>;
    songSet : Set.Set<Nat>;
  };

  type PlaylistView = {
    name : Text;
    description : Text;
    titleImage : ?Storage.ExternalBlob;
    songIds : [Nat];
  };

  let playlistFavorites = Map.empty<Principal, Set.Set<Text>>();
  let favorites = Map.empty<Principal, Set.Set<Nat>>();
  let userPlaylists = Map.empty<Principal, Map.Map<Text, Playlist>>();
  let officialPlaylists = Map.empty<Text, Playlist>();

  // Universal Home Channel Banner Image
  var universalHomeBanner : ?Storage.ExternalBlob = null;

  // Default to "Aesthetic Moments from My Week (1)" image (existing asset path)
  let defaultBannerPath : Text = "Aesthetic Moments from My Week (1)";

  public query ({ caller }) func getUniversalHomeBanner() : async ?Storage.ExternalBlob {
    universalHomeBanner;
  };

  public shared ({ caller }) func setUniversalHomeBanner(blob : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set the universal banner");
    };
    universalHomeBanner := ?blob;
  };

  public shared ({ caller }) func setUniversalHomeBannerFromURL(_url : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set the universal banner from URL");
    };
    universalHomeBanner := null;
  };

  public shared ({ caller }) func clearUniversalHomeBanner() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can clear the universal banner");
    };
    universalHomeBanner := null;
  };

  public query ({ caller }) func getDefaultBannerPath() : async Text {
    defaultBannerPath;
  };

  public query ({ caller }) func checkAuthorization() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return false;
    };
    true;
  };

  func verifyAdminPasscode(passcode : Text) : Bool {
    passcode == adminPasscode;
  };

  public shared ({ caller }) func verifyAdminPasscodeForHiddenAdminMode(passcode : Text) : async () {
    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };
  };

  public shared ({ caller }) func addSong(
    title : Text,
    artist : Text,
    albumArt : Storage.ExternalBlob,
    titleImage : Storage.ExternalBlob,
    audioFile : Storage.ExternalBlob,
    lyrics : Text,
    passcode : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add songs");
    };

    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
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
        let newLikesCount = if (isLiked) { Nat.max(0, song.likesCount - 1) } else { song.likesCount + 1 };
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
    switch (songs.get(id)) {
      case (null) { Runtime.trap("Song not found") };
      case (?song) { toSongView(song) };
    };
  };

  public query ({ caller }) func getAllSongs() : async [SongView] {
    songs.values().toArray().map(toSongView).sort();
  };

  public query ({ caller }) func getAllSongsByTitle() : async [SongView] {
    songs.values().toArray().map(toSongView).sort(SongView.compareByTitle);
  };

  public shared ({ caller }) func deleteSong(id : Nat, passcode : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete songs");
    };

    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    switch (songs.get(id)) {
      case (null) { Runtime.trap("Song not found") };
      case (_song) {
        songs.remove(id);
      };
    };
  };

  public query ({ caller }) func searchSongs(keyword : Text) : async [SongView] {
    let filtered = songs.values().toArray().filter(
      func(song) {
        song.title.contains(#text keyword) or song.artist.contains(#text keyword);
      }
    );
    filtered.map(toSongView);
  };

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

  public shared ({ caller }) func createPlaylist(
    name : Text,
    description : Text,
    titleImage : ?Storage.ExternalBlob,
  ) : async () {
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
        description;
        titleImage;
        songs = List.empty<Nat>();
        songSet = Set.empty<Nat>();
      },
    );
  };

  public shared ({ caller }) func updatePlaylist(
    oldName : Text,
    newName : Text,
    description : Text,
    titleImage : ?Storage.ExternalBlob,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update their playlists");
    };

    switch (userPlaylists.get(caller)) {
      case (null) {
        Runtime.trap("Playlist not found");
      };
      case (?playlistMap) {
        switch (playlistMap.get(oldName)) {
          case (null) { Runtime.trap("Playlist not found") };
          case (?playlist) {
            if (oldName != newName and playlistMap.containsKey(newName)) {
              Runtime.trap("A playlist with the new name already exists");
            };

            let updatedPlaylist = {
              name = newName;
              description;
              titleImage;
              songs = playlist.songs;
              songSet = playlist.songSet;
            };

            if (oldName != newName) {
              playlistMap.remove(oldName);
            };

            playlistMap.add(newName, updatedPlaylist);
          };
        };
      };
    };
  };

  public shared ({ caller }) func editPlaylist(
    playlistName : Text,
    newName : Text,
    newDescription : Text,
    newTitleImage : ?Storage.ExternalBlob,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can edit their playlists");
    };

    switch (userPlaylists.get(caller)) {
      case (null) {
        Runtime.trap("Playlist not found");
      };
      case (?playlistMap) {
        switch (playlistMap.get(playlistName)) {
          case (null) { Runtime.trap("Playlist not found") };
          case (?playlist) {
            if (playlistName != newName and playlistMap.containsKey(newName)) {
              Runtime.trap("A playlist with the new name already exists");
            };

            let updatedPlaylist = {
              name = newName;
              description = newDescription;
              titleImage = newTitleImage;
              songs = playlist.songs;
              songSet = playlist.songSet;
            };

            if (playlistName != newName) {
              playlistMap.remove(playlistName);
            };

            playlistMap.add(newName, updatedPlaylist);
          };
        };
      };
    };
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
            if (playlist.songSet.contains(songId)) {
              return;
            };
            playlist.songs.add(songId);
            playlist.songSet.add(songId);
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
            if (not playlist.songSet.contains(songId)) {
              Runtime.trap("Song not found in playlist");
            };
            let newSongs = List.empty<Nat>();
            playlist.songs.forEach(
              func(sId) {
                if (sId != songId) {
                  newSongs.add(sId);
                };
              }
            );
            playlist.songs.clear();
            playlist.songs.addAll(newSongs.values());
            playlist.songSet.remove(songId);
          };
        };
      };
    };
  };

  public shared ({ caller }) func reorderPlaylist(playlistName : Text, newOrder : [Nat]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can reorder playlists");
    };

    switch (userPlaylists.get(caller)) {
      case (null) { Runtime.trap("Playlist not found") };
      case (?playlistMap) {
        switch (playlistMap.get(playlistName)) {
          case (null) { Runtime.trap("Playlist not found") };
          case (?playlist) {
            for (songId in newOrder.values()) {
              if (not playlist.songSet.contains(songId)) {
                Runtime.trap("Invalid song ID in reorder array: " # songId.toText());
              };
            };

            if (newOrder.size() != playlist.songSet.size()) {
              Runtime.trap("Reorder array must contain all songs exactly once");
            };

            playlist.songs.clear();
            for (songId in newOrder.values()) {
              playlist.songs.add(songId);
            };
          };
        };
      };
    };
  };

  func toPlaylistView(name : Text, playlist : Playlist) : PlaylistView {
    {
      name;
      description = playlist.description;
      titleImage = playlist.titleImage;
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

  public shared ({ caller }) func createOfficialPlaylist(
    name : Text,
    description : Text,
    titleImage : ?Storage.ExternalBlob,
    passcode : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create official playlists");
    };

    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    if (officialPlaylists.containsKey(name)) {
      Runtime.trap("Official playlist already exists");
    };

    officialPlaylists.add(
      name,
      {
        name;
        description;
        titleImage;
        songs = List.empty<Nat>();
        songSet = Set.empty<Nat>();
      },
    );
  };

  public shared ({ caller }) func updateOfficialPlaylist(
    oldName : Text,
    newName : Text,
    description : Text,
    titleImage : ?Storage.ExternalBlob,
    passcode : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update official playlists");
    };

    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    switch (officialPlaylists.get(oldName)) {
      case (null) { Runtime.trap("Official playlist not found") };
      case (?playlist) {
        if (oldName != newName and officialPlaylists.containsKey(newName)) {
          Runtime.trap("An official playlist with the new name already exists");
        };

        let updatedPlaylist = {
          name = newName;
          description;
          titleImage;
          songs = playlist.songs;
          songSet = playlist.songSet;
        };

        if (oldName != newName) {
          officialPlaylists.remove(oldName);
        };

        officialPlaylists.add(newName, updatedPlaylist);
      };
    };
  };

  public shared ({ caller }) func editOfficialPlaylist(
    playlistName : Text,
    newName : Text,
    newDescription : Text,
    newTitleImage : ?Storage.ExternalBlob,
    passcode : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can edit official playlists");
    };

    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    switch (officialPlaylists.get(playlistName)) {
      case (null) { Runtime.trap("Playlist not found") };
      case (?playlist) {
        if (playlistName != newName and officialPlaylists.containsKey(newName)) {
          Runtime.trap("An official playlist with the new name already exists");
        };

        let updatedPlaylist = {
          name = newName;
          description = newDescription;
          titleImage = newTitleImage;
          songs = playlist.songs;
          songSet = playlist.songSet;
        };

        if (playlistName != newName) {
          officialPlaylists.remove(playlistName);
        };

        officialPlaylists.add(newName, updatedPlaylist);
      };
    };
  };

  public shared ({ caller }) func addToOfficialPlaylist(playlistName : Text, songId : Nat, passcode : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can modify official playlists");
    };

    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    if (not songs.containsKey(songId)) {
      Runtime.trap("Song not found");
    };

    switch (officialPlaylists.get(playlistName)) {
      case (null) {
        Runtime.trap("Playlist not found");
      };
      case (?playlist) {
        if (playlist.songSet.contains(songId)) {
          return;
        };
        playlist.songs.add(songId);
        playlist.songSet.add(songId);
      };
    };
  };

  public shared ({ caller }) func removeFromOfficialPlaylist(playlistName : Text, songId : Nat, passcode : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can modify official playlists");
    };

    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    switch (officialPlaylists.get(playlistName)) {
      case (null) {
        Runtime.trap("Playlist not found");
      };
      case (?playlist) {
        if (not playlist.songSet.contains(songId)) {
          Runtime.trap("Song not found in playlist");
        };
        let newSongs = List.empty<Nat>();
        playlist.songs.forEach(
          func(sId) {
            if (sId != songId) {
              newSongs.add(sId);
            };
          }
        );
        playlist.songs.clear();
        playlist.songs.addAll(newSongs.values());
        playlist.songSet.remove(songId);
      };
    };
  };

  public shared ({ caller }) func reorderOfficialPlaylist(playlistName : Text, newOrder : [Nat], passcode : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reorder official playlists");
    };

    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    switch (officialPlaylists.get(playlistName)) {
      case (null) { Runtime.trap("Playlist not found") };
      case (?playlist) {
        for (songId in newOrder.values()) {
          if (not playlist.songSet.contains(songId)) {
            Runtime.trap("Invalid song ID in reorder array: " # songId.toText());
          };
        };

        if (newOrder.size() != playlist.songSet.size()) {
          Runtime.trap("Reorder array must contain all songs exactly once");
        };

        playlist.songs.clear();
        for (songId in newOrder.values()) {
          playlist.songs.add(songId);
        };
      };
    };
  };

  public shared ({ caller }) func deletePlaylist(playlistName : Text, passcode : ?Text) : async () {
    switch (passcode) {
      case (null) {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
          Runtime.trap("Unauthorized: Only users can delete their playlists");
        };
        switch (userPlaylists.get(caller)) {
          case (null) {
            Runtime.trap("Playlist not found");
          };
          case (?playlistMap) {
            if (not playlistMap.containsKey(playlistName)) {
              Runtime.trap("Playlist not found");
            };
            playlistMap.remove(playlistName);
          };
        };
      };
      case (?code) {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
          Runtime.trap("Unauthorized: Only admins can delete official playlists");
        };

        if (not verifyAdminPasscode(code)) {
          Runtime.trap("Invalid admin passcode");
        };

        if (not officialPlaylists.containsKey(playlistName)) {
          Runtime.trap("Official playlist not found");
        };
        officialPlaylists.remove(playlistName);
      };
    };
  };

  public query ({ caller }) func getOfficialPlaylist(playlistName : Text) : async ?PlaylistView {
    officialPlaylists.get(playlistName).map(func(playlist) { toPlaylistView(playlistName, playlist) });
  };

  public query ({ caller }) func getOfficialPlaylistDetails(playlistName : Text) : async [SongView] {
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

  public query ({ caller }) func listOfficialPlaylists() : async [PlaylistView] {
    officialPlaylists.toArray().map(
      func((name, playlist)) { toPlaylistView(name, playlist) }
    );
  };

  public shared ({ caller }) func togglePlaylistFavorite(playlistName : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can favorite playlists");
    };

    switch (officialPlaylists.get(playlistName)) {
      case (null) { Runtime.trap("Playlist not found") };
      case (?_) {
        let userFavorites = switch (playlistFavorites.get(caller)) {
          case (null) {
            let newFavorites = Set.empty<Text>();
            playlistFavorites.add(caller, newFavorites);
            newFavorites;
          };
          case (?existing) { existing };
        };

        let isFavorite = userFavorites.contains(playlistName);

        if (isFavorite) {
          userFavorites.remove(playlistName);
        } else {
          userFavorites.add(playlistName);
        };

        isFavorite;
      };
    };
  };

  public query ({ caller }) func getPlaylistFavorites() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access playlist favorites");
    };
    switch (playlistFavorites.get(caller)) {
      case (null) { [] };
      case (?favSet) { favSet.toArray() };
    };
  };

  public query ({ caller }) func isPlaylistFavorite(playlistName : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check playlist favorites");
    };
    switch (playlistFavorites.get(caller)) {
      case (null) { false };
      case (?favSet) { favSet.contains(playlistName) };
    };
  };

  public query ({ caller }) func playlistFavoritesLegacy() : async ?[Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return null;
    };

    switch (playlistFavorites.get(caller)) {
      case (null) { null };
      case (?set) { ?set.toArray() };
    };
  };

  public query ({ caller }) func getPlaylistFavoritesLegacy() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return [];
    };

    switch (playlistFavorites.get(caller)) {
      case (null) { [] };
      case (?set) { set.toArray() };
    };
  };

  type ArtistProfile = {
    bio : Text;
    youtube : Text;
    instagram : Text;
    buyMeACoffee : Text;
  };

  var artistProfile : ArtistProfile = {
    bio = "";
    youtube = "";
    instagram = "";
    buyMeACoffee = "";
  };

  public query ({ caller }) func getArtistProfile() : async ArtistProfile {
    artistProfile;
  };

  public shared ({ caller }) func updateArtistProfile(profile : ArtistProfile, passcode : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update artist profile");
    };

    if (passcode.size() == 0) {
      Runtime.trap("Invalid passcode: Passcode required by admin UI");
    };

    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    artistProfile := profile;
  };

  public type Attachment = {
    blob : Storage.ExternalBlob;
    fileName : Text;
    mimeType : Text;
  };

  public type Message = {
    id : Nat;
    sender : Text;
    content : Text;
    timestamp : Int;
    isAdmin : Bool;
    isRead : Bool;
    audioAttachment : ?Attachment;
    imageAttachment : ?Attachment;
    pdfAttachment : ?Attachment;
    fileAttachment : ?Attachment;
    recipientSeen : Bool;
  };

  public type ContactInfo = {
    name : Text;
    email : Text;
    phone : Text;
    instagram : Text;
    youtube : Text;
  };

  public type Conversation = {
    user : Principal;
    messages : [Message];
  };

  public type MessagesView = {
    messages : [Message];
    contactInfo : ?ContactInfo;
  };

  let conversations = Map.empty<Principal, [Message]>();
  var nextMessageId = 1;
  var adminContactInfo : ?ContactInfo = null;

  public shared ({ caller }) func sendMessage(content : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only signed-in users can send messages");
    };

    let message : Message = {
      id = nextMessageId;
      sender = "user";
      content;
      timestamp = 0;
      isAdmin = false;
      isRead = true;
      audioAttachment = null;
      imageAttachment = null;
      pdfAttachment = null;
      fileAttachment = null;
      recipientSeen = false;
    };

    storeAndAutoReplyMessage(caller, message);

    nextMessageId += 1;

    message.id;
  };

  public shared ({ caller }) func sendMessageWithAttachments(
    content : Text,
    audioAttachment : ?Attachment,
    imageAttachment : ?Attachment,
    pdfAttachment : ?Attachment,
    fileAttachment : ?Attachment,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only signed-in users can send messages");
    };

    let message : Message = {
      id = nextMessageId;
      sender = "user";
      content;
      timestamp = 0;
      isAdmin = false;
      isRead = true;
      audioAttachment;
      imageAttachment;
      pdfAttachment;
      fileAttachment;
      recipientSeen = false;
    };

    storeAndAutoReplyMessage(caller, message);

    nextMessageId += 1;

    message.id;
  };

  func storeAndAutoReplyMessage(user : Principal, message : Message) {
    switch (conversations.get(user)) {
      case (null) {
        conversations.add(user, [message]);
      };
      case (?existing) {
        let existingMessages = existing;
        if (existingMessages.size() >= maxMessagesPerConversation) {
          let newMessages = Array.repeat(message, maxMessagesPerConversation - 1);
          conversations.add(user, newMessages.concat([message]));
        } else {
          conversations.add(user, existing.concat([message]));
        };
      };
    };

    if (not hiddenAdminModeEnabled) {
      addAdminAutoReply(user);
    };
  };

  func addAdminAutoReply(user : Principal) {
    let autoReply : Message = {
      id = nextMessageId;
      sender = "admin";
      content = "Thank you for your message. The admin is currently offline and will respond as soon as possible.";
      timestamp = 0;
      isAdmin = true;
      isRead = false;
      audioAttachment = null;
      imageAttachment = null;
      pdfAttachment = null;
      fileAttachment = null;
      recipientSeen = false;
    };

    switch (conversations.get(user)) {
      case (null) {
        conversations.add(user, [autoReply]);
      };
      case (?existing) {
        let existingMessages = existing;
        if (existingMessages.size() >= maxMessagesPerConversation) {
          let newMessages = Array.repeat(autoReply, maxMessagesPerConversation - 1);
          conversations.add(user, newMessages.concat([autoReply]));
        } else {
          conversations.add(user, existing.concat([autoReply]));
        };
      };
    };
    nextMessageId += 1;
  };

  func newMessageHandler(user : Principal, message : Message, existing : [Message]) : () {
    if (existing.size() >= maxMessagesPerConversation) {
      let newMessages = Array.repeat(message, maxMessagesPerConversation - 1);
      conversations.add(user, newMessages.concat([message]));
    } else {
      conversations.add(user, existing.concat([message]));
    };
  };

  public shared ({ caller }) func replyToMessage(
    user : Principal,
    content : Text,
    passcode : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reply to messages");
    };

    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    let message : Message = {
      id = nextMessageId;
      sender = "admin";
      content;
      timestamp = 0;
      isAdmin = true;
      isRead = false;
      audioAttachment = null;
      imageAttachment = null;
      pdfAttachment = null;
      fileAttachment = null;
      recipientSeen = false;
    };

    switch (conversations.get(user)) {
      case (null) {
        conversations.add(user, [message]);
      };
      case (?existing) {
        newMessageHandler(user, message, existing);
      };
    };

    nextMessageId += 1;
    message.id;
  };

  public shared ({ caller }) func replyWithAttachments(
    user : Principal,
    content : Text,
    audioAttachment : ?Attachment,
    imageAttachment : ?Attachment,
    pdfAttachment : ?Attachment,
    fileAttachment : ?Attachment,
    passcode : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reply to messages");
    };

    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    let message : Message = {
      id = nextMessageId;
      sender = "admin";
      content;
      timestamp = 0;
      isAdmin = true;
      isRead = false;
      audioAttachment;
      imageAttachment;
      pdfAttachment;
      fileAttachment;
      recipientSeen = false;
    };

    switch (conversations.get(user)) {
      case (null) {
        conversations.add(user, [message]);
      };
      case (?existing) {
        newMessageHandler(user, message, existing);
      };
    };

    nextMessageId += 1;
    message.id;
  };

  public query ({ caller }) func getMessages() : async ?MessagesView {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only signed-in users can access messages");
    };
    let messages = conversations.get(caller);
    let contactInfo = adminContactInfo;
    ?{
      messages = switch (messages) {
        case (null) { [] };
        case (?msgs) { msgs };
      };
      contactInfo;
    };
  };

  public query ({ caller }) func getAllMessages(user : Principal, passcode : Text) : async ?MessagesView {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access all messages");
    };

    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    let messages = conversations.get(user);

    ?{
      messages = switch (messages) {
        case (null) { [] };
        case (?msgs) { msgs };
      };
      contactInfo = adminContactInfo;
    };
  };

  public shared ({ caller }) func deleteMessage(messageId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only signed-in users can delete messages");
    };

    switch (conversations.get(caller)) {
      case (null) { Runtime.trap("No conversation found") };
      case (?messages) {
        var messageFound = false;
        let filteredMessages = messages.filter(func(msg : Message) : Bool {
          if (msg.id == messageId) {
            messageFound := true;
            // Users can only delete their own messages (not admin messages)
            if (msg.isAdmin) {
              Runtime.trap("Unauthorized: Cannot delete admin messages");
            };
            false;
          } else {
            true;
          };
        });

        if (not messageFound) {
          Runtime.trap("Message not found");
        };

        conversations.add(caller, filteredMessages);
      };
    };
  };

  public shared ({ caller }) func deleteUserMessage(user : Principal, messageId : Nat, passcode : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete user messages");
    };

    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    // Check Hidden Admin Mode is enabled
    if (not hiddenAdminModeEnabled) {
      Runtime.trap("Unauthorized: Hidden Admin Mode must be enabled to delete messages");
    };

    switch (conversations.get(user)) {
      case (null) { Runtime.trap("No conversation found for user") };
      case (?messages) {
        let filteredMessages = messages.filter(func(msg) { msg.id != messageId });

        if (filteredMessages.size() == messages.size()) {
          Runtime.trap("Message not found");
        };

        conversations.add(user, filteredMessages);
      };
    };
  };

  public shared ({ caller }) func markLastMessageAsRead() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only signed-in users can mark messages as read");
    };
    switch (conversations.get(caller)) {
      case (null) { return };
      case (?messages) {
        if (messages.size() == 0) { return };
        let lastIndex = messages.size() - 1 : Nat;

        let currentMessage = messages[lastIndex];
        let newMessage : Message = {
          id = currentMessage.id;
          sender = currentMessage.sender;
          content = currentMessage.content;
          timestamp = currentMessage.timestamp;
          isAdmin = currentMessage.isAdmin;
          isRead = true;
          audioAttachment = currentMessage.audioAttachment;
          imageAttachment = currentMessage.imageAttachment;
          pdfAttachment = currentMessage.pdfAttachment;
          fileAttachment = currentMessage.fileAttachment;
          recipientSeen = currentMessage.recipientSeen;
        };

        let updatedMessages = Array.tabulate(
          messages.size(),
          func(i) {
            if (i == lastIndex) { newMessage } else { messages[i] };
          },
        );
        conversations.add(caller, updatedMessages);
      };
    };
  };

  public shared ({ caller }) func markMessagesAsSeen(fileOnly : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only signed-in users can mark messages as seen");
    };
    switch (conversations.get(caller)) {
      case (null) { return };
      case (?messages) {
        let updatedMessages = messages.map(
          func(msg) {
            if (not msg.isRead) {
              {
                msg with
                isRead = not fileOnly;
                recipientSeen = true;
              };
            } else { msg };
          }
        );
        conversations.add(caller, updatedMessages);
      };
    };
  };

  public shared ({ caller }) func markAllMessagesAsSeen(senderType : Text, user : Principal, passcode : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can mark all messages as seen");
    };

    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    if (not hiddenAdminModeEnabled) {
      Runtime.trap("Unauthorized: Hidden Admin Mode must be enabled");
    };

    switch (conversations.get(user)) {
      case (null) { return };
      case (?messages) {
        let updatedMessages = messages.map(
          func(msg) {
            {
              msg with
              isRead = true;
              recipientSeen = false;
            };
          }
        );
        conversations.add(user, updatedMessages);
      };
    };
  };

  public shared ({ caller }) func getUnreadMessagesCount(passcode : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get unread messages count");
    };

    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    conversations.size();
  };

  public shared ({ caller }) func updateAdminInfo(contactInfo : ?ContactInfo, passcode : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update admin info");
    };

    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    adminContactInfo := contactInfo;
  };

  public shared ({ caller }) func setHiddenAdminMode(enabled : Bool, passcode : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set hidden admin mode");
    };

    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    hiddenAdminModeEnabled := enabled;
  };

  public query ({ caller }) func getHiddenAdminModeStatus(passcode : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get hidden admin mode status");
    };

    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    hiddenAdminModeEnabled;
  };

  public query ({ caller }) func getAllConversations(passcode : Text) : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get all conversations");
    };

    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    conversations.keys().toArray();
  };

  public query ({ caller }) func getAllConversationsByUserIdPasscode(passcode : Text) : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get all conversations");
    };

    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    conversations.keys().toArray();
  };

  public shared ({ caller }) func clearMessages() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear messages");
    };
    conversations.remove(caller);
  };

  public shared ({ caller }) func adminDeleteConversation(conversationType : ?Text, conversationId : Text, passcode : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete conversations");
    };

    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    if (not hiddenAdminModeEnabled) {
      Runtime.trap("Unauthorized: Hidden Admin Mode must be enabled to delete conversations");
    };

    switch (conversations.get(Principal.fromText(conversationId))) {
      case (null) {
        Runtime.trap("Conversation not found");
      };
      case (_conversation) {
        conversations.remove(Principal.fromText(conversationId));
      };
    };
  };

  public shared ({ caller }) func updateTotalListeningTime(seconds : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update listening time");
    };
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) {
        let updatedProfile = {
          fullName = profile.fullName;
          userName = profile.userName;
          dateOfBirth = profile.dateOfBirth;
          totalListeningTime = profile.totalListeningTime + seconds;
        };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  public query ({ caller }) func getTotalListeningTime() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access listening time");
    };
    switch (userProfiles.get(caller)) {
      case (null) { 0 };
      case (?profile) { profile.totalListeningTime };
    };
  };
};
