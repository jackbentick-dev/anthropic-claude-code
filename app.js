/**
 * Australian Horse Racing Odds Dashboard
 * Main Application Controller
 */

const App = (() => {
    // DOM Elements
    let racesContainer;
    let lastUpdatedEl;
    let refreshBtn;
    let autoRefreshCheckbox;
    let venueFilter;
    let timeFilter;

    // State
    let races = [];
    let autoRefreshInterval = null;
    let isLoading = false;
    const AUTO_REFRESH_MS = 30000; // 30 seconds

    /**
     * Format time as HH:MM
     */
    function formatTime(date) {
        return date.toLocaleTimeString('en-AU', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    /**
     * Format countdown string
     */
    function formatCountdown(date) {
        const now = new Date();
        const diff = date - now;

        if (diff < 0) {
            return 'Started';
        }

        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        if (minutes < 1) {
            return `${seconds}s`;
        } else if (minutes < 60) {
            return `${minutes}m ${seconds}s`;
        } else {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours}h ${mins}m`;
        }
    }

    /**
     * Get countdown CSS class based on time remaining
     */
    function getCountdownClass(date) {
        const now = new Date();
        const diff = date - now;

        if (diff < 2 * 60 * 1000) { // Less than 2 minutes
            return 'imminent';
        } else if (diff < 15 * 60 * 1000) { // Less than 15 minutes
            return 'soon';
        }
        return 'normal';
    }

    /**
     * Format odds value for display
     */
    function formatOdds(value) {
        if (value === null || value === undefined) {
            return '-';
        }
        return value.toFixed(2);
    }

    /**
     * Format currency
     */
    function formatCurrency(value) {
        if (value === null || value === undefined) {
            return '';
        }
        return `$${value.toLocaleString()}`;
    }

    /**
     * Get the best odds between Betfair and Sportsbet
     */
    function getBestOdds(runner) {
        const betfair = runner.odds.betfair.lay;
        const sportsbet = runner.odds.sportsbet.fixed;

        if (!betfair && !sportsbet) return null;
        if (!betfair) return 'sportsbet';
        if (!sportsbet) return 'betfair';

        // For punters, lower odds are better value
        // But for lay betting, we want higher lay odds
        // So we compare sportsbet fixed vs betfair lay
        return sportsbet < betfair ? 'sportsbet' : null;
    }

    /**
     * Render a single race card
     */
    function renderRaceCard(race) {
        const countdownClass = getCountdownClass(race.time);
        const bestOddsMap = {};

        // Calculate best odds for each runner
        race.runners.forEach(runner => {
            bestOddsMap[runner.id] = getBestOdds(runner);
        });

        return `
            <div class="race-card" data-race-id="${race.id}">
                <div class="race-header">
                    <div class="race-info">
                        <div class="race-venue">${race.venue.name} (${race.venue.state})</div>
                        <div class="race-number">Race ${race.raceNumber} - ${race.raceType}</div>
                        <div class="race-distance">${race.distance}m</div>
                    </div>
                    <div class="race-time">
                        <div class="time">${formatTime(race.time)}</div>
                        <div class="countdown ${countdownClass}">${formatCountdown(race.time)}</div>
                    </div>
                </div>
                <table class="runners-table">
                    <thead>
                        <tr>
                            <th style="width: 50px;">#</th>
                            <th>Runner</th>
                            <th style="width: 80px;">Bar</th>
                            <th style="width: 80px;">Wgt</th>
                            <th class="odds-header betfair-header" style="width: 140px;">Betfair Lay</th>
                            <th class="odds-header sportsbet-header" style="width: 120px;">Sportsbet</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${race.runners.map(runner => renderRunner(runner, bestOddsMap[runner.id])).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render a single runner row
     */
    function renderRunner(runner, bestOdds) {
        const scratchedClass = runner.isScratched ? 'scratched' : '';
        const betfairBestClass = bestOdds === 'betfair' ? 'best-odds' : '';
        const sportsbetBestClass = bestOdds === 'sportsbet' ? 'best-odds' : '';

        // Odds change classes
        const betfairChangeClass = runner.odds.betfair.layChange || '';
        const sportsbetChangeClass = runner.odds.sportsbet.fixedChange || '';

        return `
            <tr class="${scratchedClass}" data-runner-id="${runner.id}">
                <td>
                    <span class="runner-number">${runner.number}</span>
                </td>
                <td>
                    <div class="runner-name-cell">
                        <span class="runner-name">
                            ${runner.name}
                            ${runner.isScratched ? '<span class="scratched-label">SCR</span>' : ''}
                        </span>
                        <span class="runner-jockey">J: ${runner.jockey}</span>
                        <span class="runner-trainer">T: ${runner.trainer}</span>
                    </div>
                </td>
                <td>${runner.barrier}</td>
                <td>${runner.weight}kg</td>
                <td class="odds-cell betfair ${betfairBestClass}">
                    ${runner.isScratched ?
                        '<span class="odds-na">-</span>' :
                        `<span class="odds-value odds-${betfairChangeClass}">${formatOdds(runner.odds.betfair.lay)}</span>
                         <div class="odds-meta">${formatCurrency(runner.odds.betfair.available)} avail</div>`
                    }
                </td>
                <td class="odds-cell sportsbet ${sportsbetBestClass}">
                    ${runner.isScratched ?
                        '<span class="odds-na">-</span>' :
                        `<span class="odds-value odds-${sportsbetChangeClass}">${formatOdds(runner.odds.sportsbet.fixed)}</span>`
                    }
                </td>
            </tr>
        `;
    }

    /**
     * Render loading state
     */
    function renderLoading() {
        return `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading races...</p>
            </div>
        `;
    }

    /**
     * Render empty state
     */
    function renderEmpty() {
        return `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                </svg>
                <h3>No Upcoming Races</h3>
                <p>There are no races matching your filters. Try adjusting your criteria.</p>
            </div>
        `;
    }

    /**
     * Filter races based on current filter values
     */
    function filterRaces(racesData) {
        const venue = venueFilter.value;
        const timeRange = timeFilter.value;
        const now = new Date();

        return racesData.filter(race => {
            // Venue filter
            if (venue !== 'all' && race.venue.name !== venue) {
                return false;
            }

            // Time filter
            if (timeRange !== 'all') {
                const timeDiff = race.time - now;
                const minutesDiff = timeDiff / 60000;

                if (timeRange === 'today') {
                    const raceDate = race.time.toDateString();
                    const todayDate = now.toDateString();
                    if (raceDate !== todayDate) return false;
                } else {
                    const maxMinutes = parseInt(timeRange, 10);
                    if (minutesDiff > maxMinutes || minutesDiff < -5) return false;
                }
            }

            return true;
        });
    }

    /**
     * Render the races container
     */
    function render() {
        if (isLoading && races.length === 0) {
            racesContainer.innerHTML = renderLoading();
            return;
        }

        const filteredRaces = filterRaces(races);

        if (filteredRaces.length === 0) {
            racesContainer.innerHTML = renderEmpty();
            return;
        }

        racesContainer.innerHTML = filteredRaces.map(race => renderRaceCard(race)).join('');
    }

    /**
     * Update venue filter options
     */
    function updateVenueFilter() {
        const venues = DataService.getVenues();
        const currentValue = venueFilter.value;

        venueFilter.innerHTML = '<option value="all">All Venues</option>';

        venues.forEach(venue => {
            const option = document.createElement('option');
            option.value = venue.name;
            option.textContent = `${venue.name} (${venue.state})`;
            venueFilter.appendChild(option);
        });

        // Restore previous selection if still valid
        if (venues.some(v => v.name === currentValue)) {
            venueFilter.value = currentValue;
        }
    }

    /**
     * Update countdown timers
     */
    function updateCountdowns() {
        const countdownElements = document.querySelectorAll('.countdown');
        const raceCards = document.querySelectorAll('.race-card');

        raceCards.forEach(card => {
            const raceId = card.dataset.raceId;
            const race = races.find(r => r.id === raceId);

            if (race) {
                const countdownEl = card.querySelector('.countdown');
                if (countdownEl) {
                    countdownEl.textContent = formatCountdown(race.time);
                    countdownEl.className = `countdown ${getCountdownClass(race.time)}`;
                }
            }
        });
    }

    /**
     * Fetch and update races
     */
    async function refreshRaces() {
        if (isLoading) return;

        isLoading = true;
        refreshBtn.classList.add('loading');

        try {
            races = await DataService.fetchRaces();
            updateVenueFilter();
            render();
            lastUpdatedEl.textContent = formatTime(new Date());
        } catch (error) {
            console.error('Error fetching races:', error);
        } finally {
            isLoading = false;
            refreshBtn.classList.remove('loading');
        }
    }

    /**
     * Start auto-refresh
     */
    function startAutoRefresh() {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
        }

        autoRefreshInterval = setInterval(() => {
            refreshRaces();
        }, AUTO_REFRESH_MS);

        // Also update countdowns every second
        setInterval(updateCountdowns, 1000);
    }

    /**
     * Stop auto-refresh
     */
    function stopAutoRefresh() {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
    }

    /**
     * Initialize the application
     */
    function init() {
        // Get DOM elements
        racesContainer = document.getElementById('racesContainer');
        lastUpdatedEl = document.getElementById('lastUpdated');
        refreshBtn = document.getElementById('refreshBtn');
        autoRefreshCheckbox = document.getElementById('autoRefresh');
        venueFilter = document.getElementById('venueFilter');
        timeFilter = document.getElementById('timeFilter');

        // Event listeners
        refreshBtn.addEventListener('click', refreshRaces);

        autoRefreshCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                startAutoRefresh();
            } else {
                stopAutoRefresh();
            }
        });

        venueFilter.addEventListener('change', render);
        timeFilter.addEventListener('change', render);

        // Initial load
        refreshRaces();

        // Start auto-refresh if checked
        if (autoRefreshCheckbox.checked) {
            startAutoRefresh();
        }

        console.log('Australian Horse Racing Odds Dashboard initialized');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API
    return {
        refresh: refreshRaces
    };
})();
