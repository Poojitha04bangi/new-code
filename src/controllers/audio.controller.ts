import { bucket } from "@/databases/index";
import mongoose from "mongoose";
import Like from "@/models/like.model";
import { AudioUrlBase } from "@/config/index"
import Audio, { audio } from "@/models/audio.model";
import Play from "@/models/play.model";
import Fav from "@/models/fav.model";
import Playlist from "@/models/playlist.model";
import User from "@/models/users/user.model";
import Artist from "@/models/users/artist.model";
import { response } from "express";

export const success = async (req, res) => {
  const { songname, title, artist, language, category, lyrics } = req.body;
  const file = AudioUrlBase + "audio/songByNamePlay/" + req.files['file'][0].filename; // Assuming 'file' is the name attribute in your form
  const image = AudioUrlBase + "audio/songByNamePlay/" + req.files['image'][0].filename;
  console.log(req.files); // Array
  try {
    const audio = Audio.create({
      songname, title, artist, language, category, file, image, lyrics
    });
    (await audio).save();
    return res.status(200).json("Details uploaded successfully");

  } catch (error) {
    return res.status(400).json({ error: "Details not uploaded." });
  }
};





//  Get Id By Song With Play Song
export const songByIDPlay = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid song ID format" });
    }
    const songStream = bucket.openDownloadStream(
      new mongoose.Types.ObjectId(id)
    );
    res.setHeader("Content-Type", "audio/mpeg");
    songStream.pipe(res);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ error: "An error occurred while fetching songs." });
  }
};



// Getting Random 5 Songs
// export const randomsongs = async (req, res) => {
//   try {
//     const songs = await bucket.find({}).toArray();
//     const random = getRandomItems(songs, 5);
//     console.log(random);
//     res.status(200).json(random);
//   } catch (error) {
//     res.status(500).json({ error: "An error occurred while fetching songs." });
//   }
// };
// function getRandomItems(array, count) {
//   const shuffled = array.slice();
//   for (let i = shuffled.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
//   }
//   return shuffled.slice(0, count);
// }


export const randomsongs = async (req, res) => {
  try {
    const songs = await Audio.find({});
    console.log(songs)
    const random = getRandomItems(songs, 5);

    if (random.length > 0) {
      const responseArray = random.map((item) => ({
        songname: item.songname,
        titles: item.title,
        artist: item.artist,
        language: item.language,
        category: item.category,
        lyrics: item.lyrics,
        song: item.file,
        image: item.image
      }));
      console.log(responseArray)
      res.status(200).json(responseArray);
    } else {
      res.status(200).json({ message: "No songs found." });
    }
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching songs." });
  }
};

function getRandomItems(array, count) {
  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}





// Getting Recently Played Songs
export const getrecentlyplayedsongs = async (req, res) => {
  try {
    const songs = await Play
      .find({})
      .sort({ "playedAt": -1 });
    res.status(200).json(songs);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "An error occurred while featching recently played songs",
    });
  }
};

// play song with specific user and song
export const playSong = async (req, res) => {
  try {
    const { userId, songId } = req.body;
    console.log(userId);
    const timestamp = new Date();
    const song = await Audio.findById(songId)
    const newSong = new Play({ userId, songId: song.file, image: song.image, timestamp });
    await newSong.save();
    res.status(200).json({ message: "Song played successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error logging the song" });
  }
};

//get lyrics
export const lyricById = async (req, res) => {
  try {
    const id = req.params.id; // Access songId from req.params
    console.log(id);
    // Find the song by ID in the database
    const song = await Audio.findById(id); // Use songId as the argument
    console.log('Found song:', song);

    if (!song) {
      return res.status(500).json({ message: 'Song not found' });
    }

    // If the song has lyrics stored in the database, return them
    if (song.lyrics) {
      return res.status(200).json({ name: song.file, img: song.image, lyrics: song.lyrics });
    }
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Getting Song By Name (Full Song Name)
export const songByName = async (req, res) => {
  try {
    const name = req.params.filename;
    console.log(name);

    const songs = await bucket
      .find({
        filename: name,
      })
      .toArray();
    if (songs.length === 0) {
      // Handle the case when no song is found with the provided _id
      return res.status(404).json({ error: "Song not found." });
    }
    console.log(songs);
    res.status(200).json(songs);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ error: "An error occurred while fetching songs." });
  }
};


// export const getAllSongsPlay = async (req, res) => {
//   try {
//     const songs = await Audio.find({});
//     res.status(200).json(songs)
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ error: "An error occurred while fetching the songs." });
//   }
// };


// export const getAllSongsPlay = async (req, res) => {
//   try {
//     // Define the page number and the number of items to load per page
//     const page = req.query.page || 1; // Default to the first page
//     const perPage = 3; // You can adjust this number as needed

//     // Calculate the number of items to skip based on the page and perPage
//     const skip = (page - 1) * perPage;

//     // Query the database to retrieve a limited number of songs
//     const songs = await Audio.find({}).skip(skip).limit(perPage);

//     res.status(200).json(songs);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "An error occurred while fetching the songs." });
//   }
// };

export const getAllSongsPlay = async (req, res) => {
  try {
    const perPage = 3; // Number of songs per page
    const page = parseInt(req.query.page, 3) || 1; // Current page, default to 1

    // Query the database to retrieve all songs
    const allSongs = await Audio.find({});

    // Calculate the total number of pages based on the number of songs and songs per page
    const totalPages = Math.ceil(allSongs.length / perPage);

    // Calculate the number of items to skip based on the current page
    const skip = (page - 1) * perPage;

    // Query the database to retrieve a limited number of songs for the current page
    const songs = allSongs.slice(skip, skip + perPage);

    res.status(200).json({ songs, totalPages, currentPage: page });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching the songs." });
  }
};



export const likesongs = async (req, res) => {
  try {
    const { songId, userId } = req.body;

    // Check if the user with the provided userId exists in your database
    const userExists = await User.exists({ _id: userId });

    if (!userExists) {
      return res.status(401).json({ message: "Please register to like a song." });
    }

    // Find the Like document for the given songId
    const existing = await Like.findOne({ songId });

    if (existing) {
      // Check if the user has already liked the song
      const userIndex = existing.userId.indexOf(userId);

      if (userIndex !== -1) {
        // Remove the userId from the existing document's userId array
        existing.userId.splice(userIndex, 1);
        existing.likes -= 1;
        await existing.save();
        res.status(200).json({ message: "Unliked song." });
      } else {
        // Add the userId to the existing document's userId array
        existing.userId.push(userId);
        existing.likes += 1;
        await existing.save();
        res.status(200).json({ message: "Liked song." });
      }
    } else {
      // Create a new Like document for the song and add the user's userId
      const newSong = new Like({
        userId: [userId], // Create an array with the user's userId
        songId,
      });
      await newSong.save();
      res.status(200).json({ message: "Liked song." });
    }
  } catch (error) {
    res.status(500).json({ error: "Error toggling the like status." });
  }
};

//Trending songs
export const Trendingsongs = async (req, res) => {
  try {
    const trendingSongs = await Like.find({ likes: { $gt: 2 } });

    // Use the map function to extract songIds and create song links
    const songLinks = trendingSongs.map((song) => {
      return `http://localhost:8080/songsplay/${song.songId}`;
    });

    res.status(200).json(songLinks);
  } catch (error) {
    res.status(500).json({ error: "Error logging the song." });
  }
};

export const songByNamePlay = async (req, res) => {
  try {
    const filename = req.params.filename;
    console.log(filename);

    // 2. validate the filename
    if (!filename) {
      res.send("Song not found");
    }

    const files = await bucket.find({ filename }).toArray();


    console.log(files);
    if (!files.length) {
      res.send("ERROR");
    }
    // 3. get file data
    const file = files.at(0)!;

    // 4. get the file contents as stream
    // Force the type to be ReadableStream since NextResponse doesn't accept GridFSBucketReadStream
    const stream = bucket.openDownloadStreamByName(filename);

    res.setHeader("Content-Type", file.contentType!);
    stream.pipe(res);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ error: "An error occurred while fetching songs." });
  }
};

export const songByWord = async (req, res) => {
  try {
    const name = req.params.filename.toLowerCase();
    const songs = await bucket.find({}).toArray();
    const filenames = songs.map((song) => song.filename.toLowerCase());
    console.log(filenames);

    let foundFilenames = [];
    for (const filename of filenames) {
      if (filename.includes(name)) {
        foundFilenames.push(filename);
      }
    }
    if (foundFilenames.length > 0) {
      res.status(200).json(foundFilenames);
    } else {
      res.status(200).json({ message: `${name} Song not found.` });
    }
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching songs." });
  }
};



// Perticular User with fav Song
// export const fav = async (req, res) => {
//   try {
//     const { userId, songId } = req.body;
//     // Log the fav played song
//     const timestamp = new Date();
//     const song= await Audio.findById(songId)
//     const newSong = new Fav({ userId, songId:song.file, image:song.image, timestamp });
//     await newSong.save();
//     res.status(200).json({ message: "added to fav Song" });
//   } catch (error) {
//     res.status(500).json({ error: "Error logging the song" });
//   }
// };

export const fav = async (req, res) => {
  try {
    const { userId, songId } = req.body;

    // Check if the song is already in the user's favorites
    const existingFavorite = await Fav.findOne({ userId, songId });

    if (existingFavorite) {
      return res.status(200).json({ message: "Song already exists in favorites" });
    }

    // Log the fav played song
    const timestamp = new Date();
    const song = await Audio.findById(songId);
    const newSong = new Fav({ userId, songId, image: song.image, timestamp });
    await newSong.save();

    return res.status(200).json({ message: "Added to favorites" });
  } catch (error) {
    return res.status(500).json({ error: "Error logging the song" });
  }
};


// Retrieve a user's fav played songs
export const favPlayed = async (req, res) => {
  try {
    const { userId } = req.params;
    // fav fav played songs for the user
    const userfavPlayed = await Fav.find({ userId }).sort({ timestamp: -1 });
    res.status(200).json({ userfavPlayed });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fav recently played songs" });
  }
};

// export const addplaylist = async (req, res) => {
//   try {
//     const { userId, playlist1, playlist2, playlist3 } = req.body;
//     const timestamp = new Date();

//     // Check if a user with the given userId already exists in the database
//     const existingUser = await Playlist.findOne({ userId });

//     if (existingUser) {
//       // Check if the songs already exist in the playlists
//       const songAlreadyInPlaylists = checkSongsExist(existingUser, [playlist1, playlist2, playlist3]);

//       if (songAlreadyInPlaylists) {
//         return res.status(400).json({ error: "One or more songs already exist in the playlists." });
//       }

//       // Append the new songs to their existing playlists
//       existingUser.playlist1 = appendSongs(existingUser.playlist1, playlist1);
//       existingUser.playlist2 = appendSongs(existingUser.playlist2, playlist2);
//       existingUser.playlist3 = appendSongs(existingUser.playlist3, playlist3);
//       existingUser.timestamp = timestamp;
//       await existingUser.save();
//       res.status(200).json({ message: "Updated playlists." });
//     } else {
//       // If the user doesn't exist, create a new record
//       const songsExist = await checkSongsExist(existingUser, [playlist1, playlist2, playlist3]);

//       if (songsExist) {
//         return res.status(400).json({ error: "One or more songs already exist in the playlists." });
//       }

//       const newSong = new Playlist({
//         userId,
//         playlist1,
//         playlist2,
//         playlist3,
//         timestamp,
//       });
//       await newSong.save();
//       res.status(200).json({ message: "Added to playlists." });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Error logging the song." });
//   }
// };

// // Helper function to check if songs exist in the playlists
// const checkSongsExist = (user, songs) => {
//   for (const song of songs) {
//     if (
//       user.playlist1.includes(song) ||
//       user.playlist2.includes(song) ||
//       user.playlist3.includes(song)
//     ) {
//       return true;
//     }
//   }
//   return false;
// };

// // Helper function to append new songs to an existing playlist
// const appendSongs = (currentPlaylist, newSongs) => {
//   if (Array.isArray(currentPlaylist) && Array.isArray(newSongs)) {
//     currentPlaylist.push(...newSongs);
//   }
//   return currentPlaylist;
// };



// Retrieve a user's playlist songs
// export const getallplaylist = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const userplaylist = await Playlist
//       .find({ userId })
//       .sort({ timestamp: -1 });
//       const link = `http://localhost:8080/songsplay/${userplaylist}`;
//     // console.log(userplaylist);

//     res.status(200).json( link);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Error playlist added songs" });
//   }
// };


export const getallplaylist = async (req, res) => {
  try {
    const { userId } = req.params;
    const userplaylists = await Playlist
      .find({ userId })
      .sort({ timestamp: -1 });

    const playlistsWithLinks = userplaylists.map(playlist => {
      const filteredPlaylist1 = playlist.playlist1.filter(song => song !== null);
      const filteredPlaylist2 = playlist.playlist2.filter(song => song !== null);
      const filteredPlaylist3 = playlist.playlist3.filter(song => song !== null);

      const links1 = filteredPlaylist1.map(song => `http://localhost:8080/songsplay/${song}`);
      const links2 = filteredPlaylist2.map(song => `http://localhost:8080/songsplay/${song}`);
      const links3 = filteredPlaylist3.map(song => `http://localhost:8080/songsplay/${song}`);

      return {
        playlist1: links1,
        playlist2: links2,
        playlist3: links3,
      };
    });

    res.status(200).json(playlistsWithLinks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error getting playlists with links" });
  }
};




export const follower = async (req, res) => {
  try {
    const { userId, artistId } = req.body;

    const existingArtist = await Artist.findById(artistId);
    const existingUser = await User.findById(userId);  //print username not userId

    if (!existingUser) {
      res.status(404).json("No User Found");
      return;
    }
    if (!existingArtist) {
      res.status(200).json("No Artist");
      return;
    }
    if (existingArtist.followers.includes(userId)) {
      res.status(200).json("Already following");
      return;
    }
    // existingArtist.followers.push(userId);
    await existingArtist.save();

    res.status(200).json("Followed");
  } catch (error) {
    res.status(500).json({ error: "Error" });
  }
};


//Artist by name

export const artistSongs = async (req, res) => {
  try {
    const artistName = req.params.artist.toLowerCase().trim(); // Normalize input artist name

    // Fetch songs from the database
    const songs = await Audio.find({});

    // Filter songs by the artist's name
    const artistSongs = songs.filter((song) => {
      const songArtist = (song.artist || "").toLowerCase();
      return songArtist.includes(artistName);
    });
    console.log(artistSongs)

    if (artistSongs.length > 0) {
      // Create an array of song filenames
      const songFilenames = artistSongs.map((song) => song.artist);
      const images = artistSongs.map((song) => song.image);

      const songslinks = [];
      const imagelinks = [];

      for (const filename of songFilenames) {
        songslinks.push({
          link: `http://localhost:8080/songsplay/${filename}`,
          links: `http://localhost:8080/songsplay/${images}`,
        });
      }

      // Create the response object
      const link = {
        artistName: artistName,
        songs: songslinks,
      };

      res.status(200).json(link);
    } else {
      res.status(200).json({ message: `${artistName} songs not found.` });
    }
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ error: "An error occurred while fetching songs." });
  }
};


export const categorySongs = async (req, res) => {
  try {
    const category = req.params.category.toLowerCase();

    // Fetch songs that match the specified category
    const songs = await Audio.find({ category: category });

    if (songs.length > 0) {
      // Extract filenames from the matching songs
      const songFilenames = songs.map((song) => song.file);
      
      res.status(200).json(songFilenames);
    } else {
      res.status(200).json({ message: `${category} songs not found.` });
    }
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ error: "An error occurred while fetching songs." });
  }
};


// // Helper function to append new songs to an existing playlist
const appendSongs = (currentPlaylist, newSongs) => {
  if (Array.isArray(currentPlaylist) && Array.isArray(newSongs)) {
    currentPlaylist.push(...newSongs); // Use the spread operator (...) to add elements from newSongs individually
  }
  return currentPlaylist;
};


export const addplaylist = async (req, res) => {
  try {
    const { userId, playlist1, playlist2, playlist3 } = req.body;
    const timestamp = new Date();
    const maxPlaylistSize = 10; // Maximum number of songs in each playlist

    // Check if a user with the given userId already exists in the database
    const existingUser = await Playlist.findOne({ userId });

    if (existingUser) {
      // Helper function to check if a song exists in a playlist
      const songExistsInPlaylist = (playlist, song) => {
        return playlist.includes(song);
      };

      // Check if each song exists in the corresponding playlist and limit the size
      if (playlist1) {
        if (songExistsInPlaylist(existingUser.playlist1, playlist1)) {
          return res.status(400).json({ message: "Song already exists in playlist1." });
        }
        existingUser.playlist1.push(playlist1);
      }

      if (playlist2) {
        if (songExistsInPlaylist(existingUser.playlist2, playlist2)) {
          return res.status(400).json({ message: "Song already exists in playlist2." });
        }
        existingUser.playlist2.push(playlist2);
      }

      if (playlist3) {
        if (songExistsInPlaylist(existingUser.playlist3, playlist3)) {
          return res.status(400).json({ message: "Song already exists in playlist3." });
        }
        existingUser.playlist3.push(playlist3);
      }

      // Limit the size of each playlist
      existingUser.playlist1 = existingUser.playlist1.slice(0, maxPlaylistSize);
      existingUser.playlist2 = existingUser.playlist2.slice(0, maxPlaylistSize);
      existingUser.playlist3 = existingUser.playlist3.slice(0, maxPlaylistSize);

      existingUser.timestamp = timestamp;
      await existingUser.save();
      res.status(200).json({ message: "Updated playlists." });
    } else {
      // If the user doesn't exist, create a new record with limited playlists
      const newSong = new Playlist({
        userId,
        playlist1: playlist1 ? [playlist1] : [],
        playlist2: playlist2 ? [playlist2] : [],
        playlist3: playlist3 ? [playlist3] : [],
        timestamp,
      });
      await newSong.save();
      res.status(200).json({ message: "Added to playlists." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error logging the song." });
  }
};


