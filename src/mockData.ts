export const mockMatches = [
  {
    id: 1,
    homeTeam: {
      id: 61,
      name: "Chelsea",
      position: 11,
      points: 39,
      form: ["W", "L", "D", "W", "L"]
    },
    awayTeam: {
      id: 66,
      name: "Manchester United",
      position: 6,
      points: 44,
      form: ["W", "W", "L", "D", "W"]
    },
    utcDate: new Date(Date.now() + 86400000).toISOString(),
    status: "SCHEDULED"
  },
  {
    id: 2,
    homeTeam: {
      id: 64,
      name: "Liverpool",
      position: 1,
      points: 63,
      form: ["W", "W", "W", "D", "W"]
    },
    awayTeam: {
      id: 65,
      name: "Manchester City",
      position: 2,
      points: 62,
      form: ["W", "W", "W", "L", "W"]
    },
    utcDate: new Date(Date.now() + 172800000).toISOString(),
    status: "SCHEDULED"
  },
  {
    id: 3,
    homeTeam: {
      id: 57,
      name: "Arsenal",
      position: 3,
      points: 61,
      form: ["W", "L", "W", "W", "D"]
    },
    awayTeam: {
      id: 73,
      name: "Tottenham",
      position: 5,
      points: 47,
      form: ["L", "W", "W", "D", "L"]
    },
    utcDate: new Date(Date.now() + 259200000).toISOString(),
    status: "SCHEDULED"
  }
];

export const mockHistoricalMatches = [
  {
    homeTeamId: 61,
    awayTeamId: 66,
    score: { home: 2, away: 1 },
    season: 2023
  },
  {
    homeTeamId: 66,
    awayTeamId: 61,
    score: { home: 3, away: 2 },
    season: 2023
  },
  {
    homeTeamId: 64,
    awayTeamId: 65,
    score: { home: 3, away: 1 },
    season: 2023
  },
  {
    homeTeamId: 65,
    awayTeamId: 64,
    score: { home: 1, away: 1 },
    season: 2023
  },
  {
    homeTeamId: 57,
    awayTeamId: 73,
    score: { home: 2, away: 2 },
    season: 2023
  },
  {
    homeTeamId: 73,
    awayTeamId: 57,
    score: { home: 0, away: 2 },
    season: 2023
  }
];