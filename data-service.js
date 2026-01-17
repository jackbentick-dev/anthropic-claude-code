/**
 * Data Service for Australian Horse Racing Odds
 * Provides mock data simulating Betfair and Sportsbet odds
 */

const DataService = (() => {
    // Australian Racing Venues
    const VENUES = [
        { name: 'Flemington', state: 'VIC', code: 'FLE' },
        { name: 'Randwick', state: 'NSW', code: 'RAN' },
        { name: 'Eagle Farm', state: 'QLD', code: 'EAG' },
        { name: 'Morphettville', state: 'SA', code: 'MOR' },
        { name: 'Ascot', state: 'WA', code: 'ASC' },
        { name: 'Moonee Valley', state: 'VIC', code: 'MOO' },
        { name: 'Rosehill', state: 'NSW', code: 'ROS' },
        { name: 'Doomben', state: 'QLD', code: 'DOO' },
        { name: 'Caulfield', state: 'VIC', code: 'CAU' },
        { name: 'Canterbury', state: 'NSW', code: 'CAN' },
        { name: 'Sandown', state: 'VIC', code: 'SAN' },
        { name: 'Warwick Farm', state: 'NSW', code: 'WAR' }
    ];

    // Australian Horse Names (realistic examples)
    const HORSE_NAMES = [
        'Nature Strip', 'Verry Elleegant', 'Incentivise', 'Zaaki',
        'Anamoe', 'I Am Invincible', 'Home Affairs', 'Profondo',
        'Bella Nipotina', 'Masked Crusader', 'Mr Brightside', 'Coolangatta',
        'Golden Slipper', 'Winx Legacy', 'Black Caviar II', 'Phar Lap Dream',
        'Melbourne Cup', 'Sydney Flash', 'Brisbane Storm', 'Perth Thunder',
        'Adelaide Spirit', 'Canberra Star', 'Outback Runner', 'Desert Wind',
        'Ocean Breeze', 'Mountain Peak', 'Valley Champion', 'River Dance',
        'Golden Dawn', 'Silver Streak', 'Bronze Medal', 'Diamond Rush',
        'Thunder Bolt', 'Lightning Fast', 'Storm Chaser', 'Wind Runner',
        'Fire Dancer', 'Ice Queen', 'Sun Seeker', 'Moon Shadow',
        'Star Gazer', 'Night Rider', 'Day Dreamer', 'Cloud Nine',
        'Lucky Charm', 'Fortune Teller', 'Magic Moment', 'Wonder Horse'
    ];

    // Jockey Names
    const JOCKEYS = [
        'J. McDonald', 'D. Oliver', 'W. Pike', 'C. Williams', 'H. Bowman',
        'K. McEvoy', 'M. Zahra', 'B. Melham', 'D. Lane', 'J. Kah',
        'R. Bayliss', 'T. Berry', 'N. Rawiller', 'B. Avdulla', 'J. Childs',
        'L. Currie', 'M. Dee', 'B. Shinn', 'G. Boss', 'C. Newitt'
    ];

    // Trainer Names
    const TRAINERS = [
        'C. Waller', 'G. Waterhouse', 'P. Payne', 'M. Price', 'J. Cummings',
        'A. Cummings', 'C. Maher', 'D. Eustace', 'L. Freedman', 'M. Kavanagh',
        'J. Sadler', 'B. Hayes', 'T. Busuttin', 'N. Young', 'P. Moody'
    ];

    // Race Types
    const RACE_TYPES = [
        'Maiden Plate', 'Class 1 Handicap', 'Class 2 Handicap', 'Class 3 Handicap',
        'Benchmark 58', 'Benchmark 64', 'Benchmark 72', 'Benchmark 78',
        'Open Handicap', 'Listed Race', 'Group 3', 'Group 2', 'Group 1'
    ];

    // Distances in meters
    const DISTANCES = [1000, 1100, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 3200];

    // Store for current races data
    let currentRaces = [];
    let previousOdds = {};

    /**
     * Generate a random element from array
     */
    function randomFrom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /**
     * Generate random odds within a range
     */
    function generateOdds(min, max) {
        const odds = min + Math.random() * (max - min);
        return Math.round(odds * 100) / 100;
    }

    /**
     * Generate Betfair lay odds (typically slightly higher than back odds)
     */
    function generateBetfairLayOdds(baseOdds) {
        // Lay odds are typically 1-5% higher than implied back odds
        const spread = 1 + (Math.random() * 0.05);
        const layOdds = baseOdds * spread;
        return Math.round(layOdds * 100) / 100;
    }

    /**
     * Generate available amount for Betfair
     */
    function generateBetfairAvailable() {
        const amounts = [50, 100, 150, 200, 250, 500, 750, 1000, 1500, 2000, 5000];
        return randomFrom(amounts);
    }

    /**
     * Simulate odds movement
     */
    function simulateOddsMovement(currentOdds, volatility = 0.03) {
        const change = (Math.random() - 0.5) * 2 * volatility * currentOdds;
        let newOdds = currentOdds + change;
        // Keep odds reasonable
        newOdds = Math.max(1.01, Math.min(newOdds, 1000));
        return Math.round(newOdds * 100) / 100;
    }

    /**
     * Generate race times for today
     */
    function generateRaceTimes(numRaces, startHour) {
        const times = [];
        const now = new Date();
        let currentHour = startHour;
        let currentMinute = Math.floor(Math.random() * 2) * 30; // Start at :00 or :30

        for (let i = 0; i < numRaces; i++) {
            const raceTime = new Date(now);
            raceTime.setHours(currentHour, currentMinute, 0, 0);
            times.push(raceTime);

            // Add 25-35 minutes between races
            currentMinute += 25 + Math.floor(Math.random() * 10);
            if (currentMinute >= 60) {
                currentMinute -= 60;
                currentHour++;
            }
        }

        return times;
    }

    /**
     * Generate runners for a race
     */
    function generateRunners(numRunners, raceId) {
        const runners = [];
        const usedNames = new Set();
        const usedJockeys = new Set();

        // Generate base odds that sum to roughly 110-130% (typical overround)
        const favoriteOdds = 2 + Math.random() * 3; // 2.00 - 5.00

        for (let i = 0; i < numRunners; i++) {
            // Get unique horse name
            let horseName;
            do {
                horseName = randomFrom(HORSE_NAMES);
            } while (usedNames.has(horseName));
            usedNames.add(horseName);

            // Get unique jockey
            let jockey;
            do {
                jockey = randomFrom(JOCKEYS);
            } while (usedJockeys.has(jockey));
            usedJockeys.add(jockey);

            // Calculate odds based on position (favorites at top)
            let baseOdds;
            if (i === 0) {
                baseOdds = favoriteOdds;
            } else if (i === 1) {
                baseOdds = favoriteOdds * (1.2 + Math.random() * 0.5);
            } else if (i === 2) {
                baseOdds = favoriteOdds * (1.8 + Math.random() * 0.7);
            } else {
                baseOdds = favoriteOdds * (2 + Math.random() * i);
            }

            // Sportsbet fixed odds
            const sportsbetOdds = Math.round(baseOdds * 100) / 100;

            // Betfair lay odds (slightly higher)
            const betfairLayOdds = generateBetfairLayOdds(baseOdds);

            // Small chance of being scratched
            const isScratched = Math.random() < 0.05;

            const runner = {
                id: `${raceId}-${i + 1}`,
                number: i + 1,
                name: horseName,
                jockey: jockey,
                trainer: randomFrom(TRAINERS),
                barrier: i + 1,
                weight: 54 + Math.floor(Math.random() * 8),
                isScratched: isScratched,
                odds: {
                    betfair: {
                        lay: isScratched ? null : betfairLayOdds,
                        available: isScratched ? null : generateBetfairAvailable()
                    },
                    sportsbet: {
                        fixed: isScratched ? null : sportsbetOdds
                    }
                }
            };

            runners.push(runner);
        }

        // Sort by sportsbet odds (favorites first)
        runners.sort((a, b) => {
            if (a.isScratched && !b.isScratched) return 1;
            if (!a.isScratched && b.isScratched) return -1;
            if (a.isScratched && b.isScratched) return a.number - b.number;
            return (a.odds.sportsbet.fixed || 999) - (b.odds.sportsbet.fixed || 999);
        });

        return runners;
    }

    /**
     * Generate race meetings for the day
     */
    function generateRaceMeetings() {
        const meetings = [];
        const usedVenues = new Set();
        const numMeetings = 3 + Math.floor(Math.random() * 3); // 3-5 meetings

        for (let m = 0; m < numMeetings; m++) {
            // Get unique venue
            let venue;
            do {
                venue = randomFrom(VENUES);
            } while (usedVenues.has(venue.name));
            usedVenues.add(venue.name);

            const numRaces = 7 + Math.floor(Math.random() * 3); // 7-9 races
            const startHour = 11 + m; // Stagger start times
            const raceTimes = generateRaceTimes(numRaces, startHour);

            const races = [];
            for (let r = 0; r < numRaces; r++) {
                const raceId = `${venue.code}-R${r + 1}`;
                const numRunners = 8 + Math.floor(Math.random() * 8); // 8-15 runners

                races.push({
                    id: raceId,
                    raceNumber: r + 1,
                    venue: venue,
                    raceType: randomFrom(RACE_TYPES),
                    distance: randomFrom(DISTANCES),
                    time: raceTimes[r],
                    runners: generateRunners(numRunners, raceId),
                    status: 'upcoming'
                });
            }

            meetings.push({
                venue: venue,
                races: races
            });
        }

        return meetings;
    }

    /**
     * Flatten meetings into a sorted list of races
     */
    function flattenAndSortRaces(meetings) {
        const allRaces = [];

        meetings.forEach(meeting => {
            meeting.races.forEach(race => {
                allRaces.push(race);
            });
        });

        // Sort by race time
        allRaces.sort((a, b) => a.time - b.time);

        return allRaces;
    }

    /**
     * Update odds with simulated movement
     */
    function updateOddsWithMovement(races) {
        races.forEach(race => {
            race.runners.forEach(runner => {
                if (runner.isScratched) return;

                const runnerId = runner.id;
                const prev = previousOdds[runnerId];

                // Simulate Betfair odds movement
                if (runner.odds.betfair.lay) {
                    const newBetfairLay = simulateOddsMovement(runner.odds.betfair.lay);
                    runner.odds.betfair.layChange = prev ?
                        (newBetfairLay > prev.betfairLay ? 'up' : newBetfairLay < prev.betfairLay ? 'down' : null) : null;
                    runner.odds.betfair.lay = newBetfairLay;
                    runner.odds.betfair.available = generateBetfairAvailable();
                }

                // Simulate Sportsbet odds movement (less frequent)
                if (runner.odds.sportsbet.fixed && Math.random() < 0.3) {
                    const newSportsbetFixed = simulateOddsMovement(runner.odds.sportsbet.fixed, 0.02);
                    runner.odds.sportsbet.fixedChange = prev ?
                        (newSportsbetFixed > prev.sportsbetFixed ? 'up' : newSportsbetFixed < prev.sportsbetFixed ? 'down' : null) : null;
                    runner.odds.sportsbet.fixed = newSportsbetFixed;
                } else if (runner.odds.sportsbet.fixed) {
                    runner.odds.sportsbet.fixedChange = null;
                }

                // Store current odds for next comparison
                previousOdds[runnerId] = {
                    betfairLay: runner.odds.betfair.lay,
                    sportsbetFixed: runner.odds.sportsbet.fixed
                };
            });
        });

        return races;
    }

    /**
     * Filter out past races and update statuses
     */
    function filterAndUpdateRaces(races) {
        const now = new Date();

        return races.filter(race => {
            const timeDiff = race.time - now;

            // Remove races that started more than 5 minutes ago
            if (timeDiff < -5 * 60 * 1000) {
                return false;
            }

            // Update race status
            if (timeDiff < 0) {
                race.status = 'running';
            } else if (timeDiff < 2 * 60 * 1000) {
                race.status = 'imminent';
            } else if (timeDiff < 15 * 60 * 1000) {
                race.status = 'soon';
            } else {
                race.status = 'upcoming';
            }

            return true;
        });
    }

    /**
     * Initialize the data service
     */
    function init() {
        const meetings = generateRaceMeetings();
        currentRaces = flattenAndSortRaces(meetings);

        // Store initial odds
        currentRaces.forEach(race => {
            race.runners.forEach(runner => {
                if (!runner.isScratched) {
                    previousOdds[runner.id] = {
                        betfairLay: runner.odds.betfair.lay,
                        sportsbetFixed: runner.odds.sportsbet.fixed
                    };
                }
            });
        });

        return currentRaces;
    }

    /**
     * Fetch latest odds (simulates API call)
     */
    async function fetchRaces() {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

        // If no races exist, initialize
        if (currentRaces.length === 0) {
            init();
        }

        // Update odds with movement
        currentRaces = updateOddsWithMovement(currentRaces);

        // Filter and update statuses
        currentRaces = filterAndUpdateRaces(currentRaces);

        // If all races are done, regenerate for demo purposes
        if (currentRaces.length === 0) {
            init();
        }

        return [...currentRaces];
    }

    /**
     * Get unique venues from current races
     */
    function getVenues() {
        const venueSet = new Set();
        const venues = [];

        currentRaces.forEach(race => {
            if (!venueSet.has(race.venue.name)) {
                venueSet.add(race.venue.name);
                venues.push(race.venue);
            }
        });

        return venues.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Public API
    return {
        init,
        fetchRaces,
        getVenues
    };
})();
