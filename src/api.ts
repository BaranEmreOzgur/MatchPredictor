import axios, { AxiosError } from 'axios';
import { Match, Team, HistoricalMatch } from './types';
import { mockMatches, mockHistoricalMatches } from './mockData';

// Multiple API keys for fallback
const API_KEYS = [
  '6b4628520a464ba7bd652f04cf7018f7',
  '5e8d69f2f7ac48f3a8230bce3c865b1e',
  'c5ea5b9725424b8e9f9e6c963c7889a3'
];

const BASE_URL = 'https://cors-proxy.fringe.zone/https://api.football-data.org/v4';

let currentKeyIndex = 0;
let useMockData = false;

const createApiInstance = (apiKey: string) => axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-Auth-Token': apiKey
  },
  timeout: 30000
});

let api = createApiInstance(API_KEYS[currentKeyIndex]);

const rotateApiKey = () => {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  api = createApiInstance(API_KEYS[currentKeyIndex]);
  console.log('Rotating to next API key...');
};

const fetchWithRetry = async (request: () => Promise<any>, maxRetries = 3) => {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries * API_KEYS.length; i++) {
    try {
      return await request();
    } catch (error) {
      lastError = error as Error;
      
      if (error instanceof AxiosError) {
        if (error.response?.status === 429 || error.response?.status === 403) {
          console.log('Rate limit or auth error, rotating API key...');
          rotateApiKey();
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else if (error.code === 'ECONNABORTED' || error.message.includes('Network Error')) {
          await new Promise(resolve => setTimeout(resolve, Math.min(3000 * Math.pow(2, i % maxRetries), 10000)));
        } else {
          await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, i % maxRetries), 8000)));
        }
      }
      
      if (i === maxRetries * API_KEYS.length - 1) {
        useMockData = true;
        console.log('Switching to mock data after all retries failed');
        throw lastError;
      }
    }
  }
};

const historicalMatchesStore: { matches: HistoricalMatch[] } = {
  matches: []
};

const fetchHistoricalMatches = async () => {
  try {
    if (useMockData) {
      historicalMatchesStore.matches = mockHistoricalMatches;
      return;
    }

    const seasons = [2023, 2024];
    const matchPromises = seasons.map(season => 
      fetchWithRetry(() => api.get(`/competitions/PL/matches?season=${season}&status=FINISHED`))
    );
    
    const responses = await Promise.all(matchPromises);
    const allMatches = responses.flatMap(response => response.data.matches);
    
    historicalMatchesStore.matches = allMatches.map((match: any) => ({
      homeTeamId: match.homeTeam.id,
      awayTeamId: match.awayTeam.id,
      score: {
        home: match.score.fullTime.home,
        away: match.score.fullTime.away
      },
      season: match.season.id
    }));
  } catch (error) {
    console.error('Failed to fetch historical matches:', error instanceof Error ? error.message : 'Unknown error');
    historicalMatchesStore.matches = mockHistoricalMatches;
  }
};

fetchHistoricalMatches().catch(error => {
  console.error('Failed to initialize historical matches:', error instanceof Error ? error.message : 'Unknown error');
  historicalMatchesStore.matches = mockHistoricalMatches;
});

export const getHistoricalMatchups = (homeTeamId: number, awayTeamId: number) => {
  return historicalMatchesStore.matches.filter(match => 
    (match.homeTeamId === homeTeamId && match.awayTeamId === awayTeamId) ||
    (match.homeTeamId === awayTeamId && match.awayTeamId === homeTeamId)
  );
};

export const getMatches = async (): Promise<Match[]> => {
  try {
    if (useMockData) {
      console.log('Using mock match data');
      return mockMatches;
    }

    const today = new Date();
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(today.getDate() + 10);

    const dateFrom = today.toISOString().split('T')[0];
    const dateTo = tenDaysFromNow.toISOString().split('T')[0];

    const [matchesResponse, standingsResponse] = await Promise.all([
      fetchWithRetry(() => api.get(`/competitions/PL/matches?dateFrom=${dateFrom}&dateTo=${dateTo}&status=SCHEDULED`)),
      fetchWithRetry(() => api.get('/competitions/PL/standings'))
    ]);

    const standings = standingsResponse.data.standings[0].table;
    const teamStats = new Map(standings.map((item: any) => [
      item.team.id,
      {
        position: item.position,
        points: item.points,
        form: item.form?.split(',') || []
      }
    ]));

    return matchesResponse.data.matches.map((match: any) => ({
      id: match.id,
      homeTeam: {
        id: match.homeTeam.id,
        name: match.homeTeam.name,
        ...teamStats.get(match.homeTeam.id)
      },
      awayTeam: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        ...teamStats.get(match.awayTeam.id)
      },
      utcDate: match.utcDate,
      status: match.status
    }));
  } catch (error) {
    console.log('API error, falling back to mock data');
    if (error instanceof AxiosError) {
      console.error('API Error:', error.message);
      if (error.response?.status === 429) {
        console.error('Rate limit exceeded. Using mock data.');
      }
    } else if (error instanceof Error) {
      console.error('Unexpected error:', error.message);
    }
    return mockMatches;
  }
};