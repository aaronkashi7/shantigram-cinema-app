// BACKEND INTEGRATION POINT: Replace this with Zustand/Redux + API calls

export type SeatStatus = 'AVAILABLE' | 'SELECTED' | 'LOCKED' | 'BOOKED' | 'BLOCKED';

export interface Seat {
  id: string;
  row: string;
  number: number;
  status: SeatStatus;
}

export interface Showtime {
  id: string;
  movieId: string;
  time: string;
  date: string;
  availableSeats: number;
  seats: Seat[];
}

/** A scheduled showtime created by admin — separate from movie catalog */
export interface ScheduledShowtime {
  id: string;
  movieId: string;
  date: string;
  time: string;
  totalSeats: number;
  lockedSeats: string[];
  blockedSeats: string[];
}

export interface Movie {
  id: string;
  imdbID?: string;
  title: string;
  year: string;
  poster: string;
  backdrop?: string;
  plot: string;
  genre: string;
  runtime: string;
  rating: string;
  director: string;
  cast: string;
  language: string;
  certificate: string;
  showtimes: Showtime[];
  // Extended metadata
  posterUrl?: string;
  backdropUrl?: string;
  votes?: string;
  languages?: string[];
  genres?: string[];
  certification?: string;
  status?: 'NOW_SHOWING' | 'COMING_SOON';
}

export interface BookingState {
  movie: Movie | null;
  showtime: Showtime | null;
  selectedSeats: Seat[];
  bookingRef: string;
  employeeId: string;
}

// Generate 197-seat layout
export function generateSeats(movieId: string, showtimeId: string): Seat[] {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
  const seats: Seat[] = [];

  rows.forEach((row) => {
    const count = row === 'A' ? 17 : 15;
    for (let n = 1; n <= count; n++) {
      seats.push({
        id: `${movieId}-${showtimeId}-${row}-${n}`,
        row,
        number: n,
        status: 'AVAILABLE'
      });
    }
  });

  return seats;
}

export const SAMPLE_MOVIES: Movie[] = [
{
  id: 'movie-001',
  imdbID: 'tt9362722',
  title: 'Spider-Man: Across the Spider-Verse',
  year: '2023',
  poster: "https://img.rocket.new/generatedImages/rocket_gen_img_1f2193895-1769370481453.png",
  backdrop: "https://img.rocket.new/generatedImages/rocket_gen_img_1f2193895-1769370481453.png",
  posterUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_1f2193895-1769370481453.png",
  backdropUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_1f2193895-1769370481453.png",
  plot: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
  genre: 'Animation, Action, Adventure',
  genres: ['Animation', 'Action', 'Adventure', 'Sci-Fi'],
  runtime: '140 min',
  rating: '8.6',
  votes: '4,12,000',
  director: 'Joaquim Dos Santos',
  cast: 'Shameik Moore, Hailee Steinfeld, Oscar Isaac',
  language: 'English',
  languages: ['English', 'Hindi'],
  certificate: 'U/A',
  certification: 'U/A',
  status: 'NOW_SHOWING',
  showtimes: [
  { id: 'st-001-6pm', movieId: 'movie-001', time: '6:00 PM', date: '', availableSeats: 142, seats: [] },
  { id: 'st-001-9pm', movieId: 'movie-001', time: '9:00 PM', date: '', availableSeats: 178, seats: [] }]
},
{
  id: 'movie-002',
  imdbID: 'tt15398776',
  title: 'Oppenheimer',
  year: '2023',
  poster: "https://img.rocket.new/generatedImages/rocket_gen_img_1f2fe71f5-1785140106052.png",
  backdrop: "https://img.rocket.new/generatedImages/rocket_gen_img_1f2fe71f5-1785140106052.png",
  posterUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_1f2fe71f5-1785140106052.png",
  backdropUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_1f2fe71f5-1785140106052.png",
  plot: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
  genre: 'Biography, Drama, History',
  genres: ['Biography', 'Drama', 'History', 'Thriller'],
  runtime: '180 min',
  rating: '8.9',
  votes: '8,50,000',
  director: 'Christopher Nolan',
  cast: 'Cillian Murphy, Emily Blunt, Matt Damon',
  language: 'English',
  languages: ['English', 'Hindi'],
  certificate: 'UA 16+',
  certification: 'UA 16+',
  status: 'NOW_SHOWING',
  showtimes: [
  { id: 'st-002-6pm', movieId: 'movie-002', time: '6:00 PM', date: '', availableSeats: 89, seats: [] },
  { id: 'st-002-9pm', movieId: 'movie-002', time: '9:00 PM', date: '', availableSeats: 161, seats: [] }]
},
{
  id: 'movie-003',
  imdbID: 'tt12037194',
  title: 'Drishyam 2',
  year: '2022',
  poster: "https://img.rocket.new/generatedImages/rocket_gen_img_1b803e6db-1773067896213.png",
  backdrop: "https://img.rocket.new/generatedImages/rocket_gen_img_1b803e6db-1773067896213.png",
  posterUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_1b803e6db-1773067896213.png",
  backdropUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_1b803e6db-1773067896213.png",
  plot: 'Vijay Salgaonkar and his family are once again entangled in a murder mystery. He must use his wits to protect his family from the law.',
  genre: 'Crime, Drama, Thriller',
  genres: ['Crime', 'Drama', 'Thriller'],
  runtime: '152 min',
  rating: '8.2',
  votes: '2,30,000',
  director: 'Abhishek Pathak',
  cast: 'Ajay Devgn, Tabu, Akshaye Khanna',
  language: 'Hindi',
  languages: ['Hindi'],
  certificate: 'U/A',
  certification: 'U/A',
  status: 'NOW_SHOWING',
  showtimes: [
  { id: 'st-003-3pm', movieId: 'movie-003', time: '3:00 PM', date: '', availableSeats: 120, seats: [] },
  { id: 'st-003-9pm', movieId: 'movie-003', time: '9:00 PM', date: '', availableSeats: 95, seats: [] }]
},
{
  id: 'movie-004',
  imdbID: 'tt12412888',
  title: 'Avengers: Endgame',
  year: '2019',
  poster: "https://img.rocket.new/generatedImages/rocket_gen_img_17d5426ec-1766324618996.png",
  backdrop: "https://img.rocket.new/generatedImages/rocket_gen_img_17d5426ec-1766324618996.png",
  posterUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_17d5426ec-1766324618996.png",
  backdropUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_17d5426ec-1766324618996.png",
  plot: 'After the devastating events of Infinity War, the Avengers assemble once more to reverse Thanos\'s actions and restore balance to the universe.',
  genre: 'Action, Adventure, Drama',
  genres: ['Action', 'Adventure', 'Sci-Fi'],
  runtime: '181 min',
  rating: '8.4',
  votes: '12,00,000',
  director: 'Anthony Russo, Joe Russo',
  cast: 'Robert Downey Jr., Chris Evans, Mark Ruffalo',
  language: 'English',
  languages: ['English', 'Hindi', 'Tamil', 'Telugu'],
  certificate: 'U/A',
  certification: 'U/A',
  status: 'NOW_SHOWING',
  showtimes: [
  { id: 'st-004-6pm', movieId: 'movie-004', time: '6:00 PM', date: '', availableSeats: 75, seats: [] },
  { id: 'st-004-9pm', movieId: 'movie-004', time: '9:00 PM', date: '', availableSeats: 110, seats: [] }]
},
{
  id: 'movie-005',
  imdbID: 'tt14444726',
  title: 'Hanu-Man',
  year: '2024',
  poster: "https://img.rocket.new/generatedImages/rocket_gen_img_18e148c49-1784627394395.png",
  backdrop: "https://img.rocket.new/generatedImages/rocket_gen_img_18e148c49-1784627394395.png",
  posterUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_18e148c49-1784627394395.png",
  backdropUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_18e148c49-1784627394395.png",
  plot: 'A young man from a small village gains superpowers and must protect his people from a powerful villain who seeks to exploit them.',
  genre: 'Action, Fantasy, Drama',
  genres: ['Action', 'Fantasy', 'Drama'],
  runtime: '158 min',
  rating: '8.1',
  votes: '1,85,000',
  director: 'Prasanth Varma',
  cast: 'Teja Sajja, Amritha Aiyer, Varalaxmi Sarathkumar',
  language: 'Telugu',
  languages: ['Telugu', 'Hindi', 'Tamil'],
  certificate: 'U/A',
  certification: 'U/A',
  status: 'NOW_SHOWING',
  showtimes: [
  { id: 'st-005-3pm', movieId: 'movie-005', time: '3:00 PM', date: '', availableSeats: 140, seats: [] },
  { id: 'st-005-6pm', movieId: 'movie-005', time: '6:00 PM', date: '', availableSeats: 88, seats: [] }]
},
{
  id: 'movie-006',
  imdbID: 'tt15239678',
  title: 'Kalki 2898 AD',
  year: '2024',
  poster: "https://img.rocket.new/generatedImages/rocket_gen_img_1a8c914b0-1781232467484.png",
  backdrop: "https://img.rocket.new/generatedImages/rocket_gen_img_1a8c914b0-1781232467484.png",
  posterUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_1a8c914b0-1781232467484.png",
  backdropUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_1a8c914b0-1781232467484.png",
  plot: 'Set in a dystopian future, a warrior must protect the last hope of humanity — a pregnant woman carrying the future savior — from a tyrannical ruler.',
  genre: 'Action, Sci-Fi, Fantasy',
  genres: ['Action', 'Sci-Fi', 'Fantasy'],
  runtime: '181 min',
  rating: '7.8',
  votes: '2,10,000',
  director: 'Nag Ashwin',
  cast: 'Prabhas, Deepika Padukone, Amitabh Bachchan',
  language: 'Telugu',
  languages: ['Telugu', 'Hindi', 'Tamil', 'Malayalam'],
  certificate: 'U/A',
  certification: 'U/A',
  status: 'NOW_SHOWING',
  showtimes: [
  { id: 'st-006-6pm', movieId: 'movie-006', time: '6:00 PM', date: '', availableSeats: 130, seats: [] },
  { id: 'st-006-9pm', movieId: 'movie-006', time: '9:00 PM', date: '', availableSeats: 165, seats: [] }]
},
{
  id: 'movie-007',
  imdbID: 'tt15239679',
  title: 'Dune: Part Two',
  year: '2024',
  poster: "https://img.rocket.new/generatedImages/rocket_gen_img_16221970c-1766888767711.png",
  backdrop: "https://img.rocket.new/generatedImages/rocket_gen_img_16221970c-1766888767711.png",
  posterUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_16221970c-1766888767711.png",
  backdropUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_16221970c-1766888767711.png",
  plot: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
  genre: 'Action, Adventure, Drama',
  genres: ['Action', 'Adventure', 'Sci-Fi', 'Thriller'],
  runtime: '166 min',
  rating: '8.5',
  votes: '5,60,000',
  director: 'Denis Villeneuve',
  cast: 'Timothée Chalamet, Zendaya, Rebecca Ferguson',
  language: 'English',
  languages: ['English', 'Hindi'],
  certificate: 'U/A',
  certification: 'U/A',
  status: 'NOW_SHOWING',
  showtimes: [
  { id: 'st-007-6pm', movieId: 'movie-007', time: '6:00 PM', date: '', availableSeats: 100, seats: [] },
  { id: 'st-007-9pm', movieId: 'movie-007', time: '9:00 PM', date: '', availableSeats: 145, seats: [] }]
},
{
  id: 'movie-008',
  imdbID: 'tt12637874',
  title: 'Jawan',
  year: '2023',
  poster: "https://img.rocket.new/generatedImages/rocket_gen_img_15893603b-1776176442155.png",
  backdrop: "https://img.rocket.new/generatedImages/rocket_gen_img_15893603b-1776176442155.png",
  posterUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_15893603b-1776176442155.png",
  backdropUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_15893603b-1776176442155.png",
  plot: 'A man is driven by a personal vendetta to rectify the wrongs in society, while keeping a promise made years ago.',
  genre: 'Action, Thriller, Drama',
  genres: ['Action', 'Thriller', 'Drama'],
  runtime: '169 min',
  rating: '7.1',
  votes: '1,40,000',
  director: 'Atlee',
  cast: 'Shah Rukh Khan, Nayanthara, Vijay Sethupathi',
  language: 'Hindi',
  languages: ['Hindi', 'Tamil', 'Telugu'],
  certificate: 'U/A',
  certification: 'U/A',
  status: 'NOW_SHOWING',
  showtimes: [
  { id: 'st-008-3pm', movieId: 'movie-008', time: '3:00 PM', date: '', availableSeats: 155, seats: [] },
  { id: 'st-008-9pm', movieId: 'movie-008', time: '9:00 PM', date: '', availableSeats: 120, seats: [] }]
},
{
  id: 'movie-009',
  imdbID: 'tt14444727',
  title: 'Fighter',
  year: '2024',
  poster: "https://img.rocket.new/generatedImages/rocket_gen_img_45656b99b-1790831869899.png",
  backdrop: "https://img.rocket.new/generatedImages/rocket_gen_img_45656b99b-1790831869899.png",
  posterUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_45656b99b-1790831869899.png",
  backdropUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_45656b99b-1790831869899.png",
  plot: 'India\'s first aerial action franchise follows the Air Dragon Squadron as they take on a dangerous mission to protect the nation.',
  genre: 'Action, Thriller',
  genres: ['Action', 'Thriller'],
  runtime: '166 min',
  rating: '6.8',
  votes: '85,000',
  director: 'Siddharth Anand',
  cast: 'Hrithik Roshan, Deepika Padukone, Anil Kapoor',
  language: 'Hindi',
  languages: ['Hindi'],
  certificate: 'U/A',
  certification: 'U/A',
  status: 'NOW_SHOWING',
  showtimes: [
  { id: 'st-009-6pm', movieId: 'movie-009', time: '6:00 PM', date: '', availableSeats: 110, seats: [] },
  { id: 'st-009-9pm', movieId: 'movie-009', time: '9:00 PM', date: '', availableSeats: 90, seats: [] }]
},
{
  id: 'movie-010',
  imdbID: 'tt14444728',
  title: 'Pushpa 2: The Rule',
  year: '2024',
  poster: "https://img.rocket.new/generatedImages/rocket_gen_img_1061328b5-1774014097976.png",
  backdrop: "https://img.rocket.new/generatedImages/rocket_gen_img_1061328b5-1774014097976.png",
  posterUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_1061328b5-1774014097976.png",
  backdropUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_1061328b5-1774014097976.png",
  plot: 'Pushpa Raj expands his red sandalwood smuggling empire while facing a formidable new enemy determined to bring him down.',
  genre: 'Action, Crime, Drama',
  genres: ['Action', 'Crime', 'Drama', 'Thriller'],
  runtime: '190 min',
  rating: '7.9',
  votes: '3,20,000',
  director: 'Sukumar',
  cast: 'Allu Arjun, Rashmika Mandanna, Fahadh Faasil',
  language: 'Telugu',
  languages: ['Telugu', 'Hindi', 'Tamil', 'Malayalam'],
  certificate: 'A',
  certification: 'A',
  status: 'COMING_SOON',
  showtimes: []
},
{
  id: 'movie-011',
  imdbID: 'tt14444729',
  title: 'Stree 2',
  year: '2024',
  poster: "https://img.rocket.new/generatedImages/rocket_gen_img_1707b8b80-1781674615925.png",
  backdrop: "https://img.rocket.new/generatedImages/rocket_gen_img_1707b8b80-1781674615925.png",
  posterUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_1707b8b80-1781674615925.png",
  backdropUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_1707b8b80-1781674615925.png",
  plot: 'The town of Chanderi faces a new supernatural threat as Stree returns with a vengeance, and the gang must unite once more to save their town.',
  genre: 'Comedy, Horror, Thriller',
  genres: ['Comedy', 'Horror', 'Thriller'],
  runtime: '135 min',
  rating: '8.0',
  votes: '2,75,000',
  director: 'Amar Kaushik',
  cast: 'Rajkummar Rao, Shraddha Kapoor, Aparshakti Khurana',
  language: 'Hindi',
  languages: ['Hindi'],
  certificate: 'U/A',
  certification: 'U/A',
  status: 'COMING_SOON',
  showtimes: []
}];

/** Default scheduled showtimes — movies 1-9 are pre-scheduled for today */
export function getDefaultScheduledShowtimes(): ScheduledShowtime[] {
  const today = new Date().toISOString().split('T')[0];
  return [
    { id: 'sched-001-6pm', movieId: 'movie-001', date: today, time: '6:00 PM', totalSeats: 197, lockedSeats: [], blockedSeats: [] },
    { id: 'sched-001-9pm', movieId: 'movie-001', date: today, time: '9:00 PM', totalSeats: 197, lockedSeats: [], blockedSeats: [] },
    { id: 'sched-002-6pm', movieId: 'movie-002', date: today, time: '6:00 PM', totalSeats: 197, lockedSeats: [], blockedSeats: [] },
    { id: 'sched-002-9pm', movieId: 'movie-002', date: today, time: '9:00 PM', totalSeats: 197, lockedSeats: [], blockedSeats: [] },
    { id: 'sched-003-3pm', movieId: 'movie-003', date: today, time: '3:00 PM', totalSeats: 197, lockedSeats: [], blockedSeats: [] },
    { id: 'sched-003-9pm', movieId: 'movie-003', date: today, time: '9:00 PM', totalSeats: 197, lockedSeats: [], blockedSeats: [] },
    { id: 'sched-004-6pm', movieId: 'movie-004', date: today, time: '6:00 PM', totalSeats: 197, lockedSeats: [], blockedSeats: [] },
    { id: 'sched-005-3pm', movieId: 'movie-005', date: today, time: '3:00 PM', totalSeats: 197, lockedSeats: [], blockedSeats: [] },
    { id: 'sched-006-9pm', movieId: 'movie-006', date: today, time: '9:00 PM', totalSeats: 197, lockedSeats: [], blockedSeats: [] },
    { id: 'sched-007-6pm', movieId: 'movie-007', date: today, time: '6:00 PM', totalSeats: 197, lockedSeats: [], blockedSeats: [] },
    { id: 'sched-008-3pm', movieId: 'movie-008', date: today, time: '3:00 PM', totalSeats: 197, lockedSeats: [], blockedSeats: [] },
    { id: 'sched-009-6pm', movieId: 'movie-009', date: today, time: '6:00 PM', totalSeats: 197, lockedSeats: [], blockedSeats: [] },
  ];
}

export function generateBookingRef(row: string, seatNum: number): string {
  const rand = Math.floor(100 + Math.random() * 900);
  return `ADP-${row}-${seatNum}-${rand}`;
}