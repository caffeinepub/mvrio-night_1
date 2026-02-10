import Array "mo:core/Array";
import Map "mo:core/Map";
import Text "mo:core/Text";
import List "mo:core/List";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Set "mo:core/Set";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import Int "mo:core/Int";

import Time "mo:core/Time";

import AccessControl "authorization/access-control";

// Run data migration on every canister upgrade.

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
    songs : Set.Set<Nat>;
  };

  type PlaylistView = {
    name : Text;
    songIds : [Nat];
  };

  let favorites = Map.empty<Principal, Set.Set<Nat>>();
  let userPlaylists = Map.empty<Principal, Map.Map<Text, Playlist>>();
  let officialPlaylists = Map.empty<Text, Playlist>();

  public query ({ caller }) func checkAuthorization() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return false;
    };
    true;
  };

  func verifyAdminPasscode(passcode : Text) : Bool {
    passcode == adminPasscode;
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
    // Verify admin passcode first for clear error message
    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    // Then verify admin role
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add songs");
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
    // No authorization required - guests can play songs
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
    // No authorization required - guests can view songs
    switch (songs.get(id)) {
      case (null) { Runtime.trap("Song not found") };
      case (?song) { toSongView(song) };
    };
  };

  public query ({ caller }) func getAllSongs() : async [SongView] {
    // No authorization required - guests can view songs
    songs.values().toArray().map(toSongView).sort();
  };

  public query ({ caller }) func getAllSongsByTitle() : async [SongView] {
    // No authorization required - guests can view songs
    songs.values().toArray().map(toSongView).sort(SongView.compareByTitle);
  };

  public shared ({ caller }) func deleteSong(id : Nat, passcode : Text) : async () {
    // Verify admin passcode first for clear error message
    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    // Then verify admin role
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete songs");
    };

    switch (songs.get(id)) {
      case (null) { Runtime.trap("Song not found") };
      case (_song) {
        songs.remove(id);
      };
    };
  };

  public query ({ caller }) func searchSongs(keyword : Text) : async [SongView] {
    // No authorization required - guests can search songs
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
  public shared ({ caller }) func createOfficialPlaylist(name : Text, passcode : Text) : async () {
    // Verify admin passcode first for clear error message
    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    // Then verify admin role
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create official playlists");
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

  public shared ({ caller }) func addToOfficialPlaylist(playlistName : Text, songId : Nat, passcode : Text) : async () {
    // Verify admin passcode first for clear error message
    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    // Then verify admin role
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can modify official playlists");
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

  public shared ({ caller }) func removeFromOfficialPlaylist(playlistName : Text, songId : Nat, passcode : Text) : async () {
    // Verify admin passcode first for clear error message
    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    // Then verify admin role
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can modify official playlists");
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

  public shared ({ caller }) func deletePlaylist(playlistName : Text, passcode : ?Text) : async () {
    switch (passcode) {
      case (null) {
        // User deleting their own playlist
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
        // Admin deleting official playlist
        // Verify admin passcode first for clear error message
        if (not verifyAdminPasscode(code)) {
          Runtime.trap("Invalid admin passcode");
        };

        // Then verify admin role
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
          Runtime.trap("Unauthorized: Only admins can delete official playlists");
        };

        if (not officialPlaylists.containsKey(playlistName)) {
          Runtime.trap("Official playlist not found");
        };
        officialPlaylists.remove(playlistName);
      };
    };
  };

  public query ({ caller }) func getOfficialPlaylist(playlistName : Text) : async ?PlaylistView {
    // No authorization required - guests can view official playlists
    officialPlaylists.get(playlistName).map(func(playlist) { toPlaylistView(playlistName, playlist) });
  };

  public query ({ caller }) func getOfficialPlaylistDetails(playlistName : Text) : async [SongView] {
    // No authorization required - guests can view official playlists
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
    // No authorization required - guests can view official playlists
    officialPlaylists.toArray().map(
      func((name, playlist)) { toPlaylistView(name, playlist) }
    );
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
    // No authorization required - guests can view artist profile
    artistProfile;
  };

  public shared ({ caller }) func updateArtistProfile(profile : ArtistProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update artist profile");
    };
    artistProfile := profile;
  };

  // Messaging & Chat

  public type Message = {
    id : Nat;
    sender : Text;
    content : Text;
    timestamp : Int;
    isAdmin : Bool;
    isRead : Bool;
    audioAttachment : ?Storage.ExternalBlob;
    imageAttachment : ?Storage.ExternalBlob;
    pdfAttachment : ?Storage.ExternalBlob;
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
      recipientSeen = false;
    };

    storeAndAutoReplyMessage(caller, message);

    nextMessageId += 1;

    message.id;
  };

  // Handle new message with attachments
  public shared ({ caller }) func sendMessageWithAttachments(
    content : Text,
    audioAttachment : ?Storage.ExternalBlob,
    imageAttachment : ?Storage.ExternalBlob,
    pdfAttachment : ?Storage.ExternalBlob,
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
    // Verify admin passcode first for clear error message
    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    // Then verify admin role
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reply to messages");
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
    audioAttachment : ?Storage.ExternalBlob,
    imageAttachment : ?Storage.ExternalBlob,
    pdfAttachment : ?Storage.ExternalBlob,
    passcode : Text,
  ) : async Nat {
    // Verify admin passcode first for clear error message
    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    // Then verify admin role
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reply to messages");
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
    // Verify admin passcode first for clear error message
    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    // Then verify admin role
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all messages");
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
    // Verify admin passcode first for clear error message
    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    // Then verify admin role
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete user messages");
    };

    // Check Hidden Admin Mode is enabled
    if (not hiddenAdminModeEnabled) {
      Runtime.trap("Unauthorized: Hidden Admin Mode must be enabled to delete messages");
    };

    switch (conversations.get(user)) {
      case (null) { Runtime.trap("No conversation found for user") };
      case (?messages) {
        let filteredMessages = messages.filter(func(msg : Message) : Bool {
          msg.id != messageId;
        });

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
    // Verify admin passcode first for clear error message
    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    // Then verify admin role
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can mark all messages as seen");
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
    // Verify admin passcode first for clear error message
    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    // Then verify admin role
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get unread message count");
    };

    conversations.size();
  };

  // Admin-only functions

  public shared ({ caller }) func updateAdminInfo(contactInfo : ?ContactInfo) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update contact info");
    };
    adminContactInfo := contactInfo;
  };

  public shared ({ caller }) func setHiddenAdminMode(enabled : Bool, passcode : Text) : async () {
    // Verify admin passcode first for clear error message
    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    // Then verify admin role
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set Hidden Admin Mode");
    };

    hiddenAdminModeEnabled := enabled;
  };

  public query ({ caller }) func getHiddenAdminModeStatus(passcode : Text) : async Bool {
    // Verify admin passcode first for clear error message
    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    // Then verify admin role
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can check Hidden Admin Mode status");
    };

    hiddenAdminModeEnabled;
  };

  public query ({ caller }) func getAllConversations(passcode : Text) : async [Principal] {
    // Verify admin passcode first for clear error message
    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    // Then verify admin role
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all conversations");
    };

    conversations.keys().toArray();
  };

  public query ({ caller }) func getAllConversationsByUserIdPasscode(passcode : Text) : async [Principal] {
    // Verify admin passcode first for clear error message
    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    // Then verify admin role
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all conversations");
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
    // Verify admin passcode first for clear error message
    if (not verifyAdminPasscode(passcode)) {
      Runtime.trap("Invalid admin passcode");
    };

    // Then verify admin role
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete conversations");
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

  // New functions to support account and listening time tracking
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
