import { db } from './db';
import { harnesses } from '../shared/schema';
import { count } from 'drizzle-orm';

export const harnessData = [
  {
    "yearFrom": 1997,
    "yearTo": 2003,
    "make": "Acura",
    "model": "CL",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2013,
    "yearTo": 2014,
    "make": "Acura",
    "model": "ILX",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2001,
    "make": "Acura",
    "model": "Integr",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2011,
    "make": "Acura",
    "model": "MDX",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2005,
    "make": "Acura",
    "model": "NSX",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2014,
    "make": "Acura",
    "model": "RDX",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2011,
    "make": "Acura",
    "model": "RL",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2006,
    "make": "Acura",
    "model": "RSX",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2000,
    "make": "Acura",
    "model": "SLX",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2011,
    "make": "Acura",
    "model": "TL",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2011,
    "make": "Acura",
    "model": "TSX",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2009,
    "yearTo": 2011,
    "make": "Acura",
    "model": "ZDX",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2010,
    "make": "Audi",
    "model": "A3",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2010,
    "make": "Audi",
    "model": "A4",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2008,
    "yearTo": 2010,
    "make": "Audi",
    "model": "A5",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2010,
    "make": "Audi",
    "model": "A6",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2010,
    "make": "Audi",
    "model": "A8",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2005,
    "make": "Audi",
    "model": "Allroa",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2009,
    "yearTo": 2011,
    "make": "Audi",
    "model": "Q5",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2010,
    "make": "Audi",
    "model": "Q7",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2014,
    "make": "Audi",
    "model": "S4",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2000,
    "yearTo": 2014,
    "make": "Audi",
    "model": "TT",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2002,
    "make": "Autocar",
    "model": "All Models",
    "harnessType": "8-700",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 3013,
    "make": "Autocar",
    "model": "All Models",
    "harnessType": "8-600",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 1998,
    "make": "Bentley",
    "model": "Bentley",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2014,
    "make": "Bentley",
    "model": "GT",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2005,
    "make": "BlueBird",
    "model": "ALL AMERICAN/ALL CANADIAN SCHOOL BUS",
    "harnessType": "8-600",
    "comments": ""
  },
  {
    "yearFrom": 2008,
    "yearTo": 2010,
    "make": "BMW",
    "model": "1 Series (E81/E82/E87/E88)",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2005,
    "make": "BMW",
    "model": "3 Series",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2004,
    "make": "BMW",
    "model": "5 Series",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2010,
    "make": "BMW",
    "model": "6 Series",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2012,
    "make": "BMW",
    "model": "7 Series",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2000,
    "make": "BMW",
    "model": "8 Series",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2011,
    "make": "BMW",
    "model": "X3",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2000,
    "yearTo": 2011,
    "make": "BMW",
    "model": "X5",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2010,
    "make": "BMW",
    "model": "X6",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2005,
    "make": "BMW",
    "model": "Z3",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2010,
    "make": "BMW",
    "model": "Z4",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2005,
    "make": "Buick",
    "model": "Centu",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2014,
    "make": "Buick",
    "model": "Enclave",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2014,
    "make": "Buick",
    "model": "Lacrosse",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2006,
    "make": "Buick",
    "model": "Lasabre",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2011,
    "make": "Buick",
    "model": "Lucerne",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2005,
    "make": "Buick",
    "model": "Park Avenue",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2008,
    "make": "Buick",
    "model": "Rainier",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Buick",
    "model": "Regal",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2007,
    "make": "Buick",
    "model": "Rendezvous",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2000,
    "make": "Buick",
    "model": "Rivier",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2007,
    "make": "Buick",
    "model": "Terraz",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2011,
    "yearTo": 2014,
    "make": "Buick",
    "model": "Verano",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1997,
    "yearTo": 2002,
    "make": "Cadillac",
    "model": "Catera",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2014,
    "make": "Cadillac",
    "model": "CTS",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2006,
    "make": "Cadillac",
    "model": "Deville",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2012,
    "make": "Cadillac",
    "model": "DTS",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2002,
    "make": "Cadillac",
    "model": "Eldorado",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1999,
    "yearTo": 2014,
    "make": "Cadillac",
    "model": "Escalade",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2004,
    "make": "Cadillac",
    "model": "Seville",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2014,
    "make": "Cadillac",
    "model": "SRX",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2012,
    "make": "Cadillac",
    "model": "STS",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2009,
    "make": "Cadillac",
    "model": "XLR",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2011,
    "yearTo": 2014,
    "make": "CAT (Caterpillar Inc.)",
    "model": "CT660",
    "harnessType": "8-600D",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2005,
    "make": "Chevrolet",
    "model": "Astro",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2014,
    "make": "Chevrolet",
    "model": "Avalancge",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2011,
    "make": "Chevrolet",
    "model": "Aveo",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2009,
    "make": "Chevrolet",
    "model": "Aveo5",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2005,
    "make": "Chevrolet",
    "model": "Blazer",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1997,
    "yearTo": 2014,
    "make": "Chevrolet",
    "model": "C4500 to C6500",
    "harnessType": "8-800",
    "comments": "If the vehcile has a Caterpillar motor then use 8-600."
  },
  {
    "yearFrom": 1997,
    "yearTo": 2005,
    "make": "Chevrolet",
    "model": "C7500 to C8500",
    "harnessType": "Universal",
    "comments": "8-800 can be used for Power Only."
  },
  {
    "yearFrom": 2006,
    "yearTo": 2014,
    "make": "Chevrolet",
    "model": "C7500 to C8500",
    "harnessType": "8-600",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2002,
    "make": "Chevrolet",
    "model": "Camaro",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2010,
    "yearTo": 2014,
    "make": "Chevrolet",
    "model": "Camaro",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2011,
    "yearTo": 2014,
    "make": "Chevrolet",
    "model": "Caprice",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2012,
    "yearTo": 2014,
    "make": "Chevrolet",
    "model": "Captive Sport",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2005,
    "make": "Chevrolet",
    "model": "Cavalier",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2010,
    "make": "Chevrolet",
    "model": "Cobalt",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2014,
    "make": "Chevrolet",
    "model": "Colorado",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Chevrolet",
    "model": "Corvette",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2010,
    "yearTo": 2014,
    "make": "Chevrolet",
    "model": "Cruze",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2014,
    "make": "Chevrolet",
    "model": "Equinox",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Chevrolet",
    "model": "Express Van",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2011,
    "make": "Chevrolet",
    "model": "HHR",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2000,
    "yearTo": 2014,
    "make": "Chevrolet",
    "model": "Impal",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2000,
    "make": "Chevrolet",
    "model": "Lumin",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1997,
    "yearTo": 2014,
    "make": "Chevrolet",
    "model": "Malibu",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1998,
    "yearTo": 2001,
    "make": "Chevrolet",
    "model": "Metro",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2007,
    "make": "Chevrolet",
    "model": "Monte Carlo",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2012,
    "yearTo": 2014,
    "make": "Chevrolet",
    "model": "Orlando",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1998,
    "yearTo": 2002,
    "make": "Chevrolet",
    "model": "Prizm",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2004,
    "make": "Chevrolet",
    "model": "S10",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Chevrolet",
    "model": "Silverado",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2012,
    "yearTo": 2014,
    "make": "Chevrolet",
    "model": "Sonic",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2007,
    "make": "Chevrolet",
    "model": "SSR",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Chevrolet",
    "model": "Suburban",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Chevrolet",
    "model": "Tahoe",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1998,
    "yearTo": 2004,
    "make": "Chevrolet",
    "model": "Tracker",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2009,
    "make": "Chevrolet",
    "model": "Trailblazer",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2009,
    "yearTo": 2014,
    "make": "Chevrolet",
    "model": "Traverse",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2010,
    "make": "Chevrolet",
    "model": "Uplander",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1997,
    "yearTo": 2005,
    "make": "Chevrolet",
    "model": "Venture",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2011,
    "yearTo": 2014,
    "make": "Chevrolet",
    "model": "Volt",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2014,
    "make": "Chrysler",
    "model": "300",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2009,
    "make": "Chrysler",
    "model": "Aspen",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2000,
    "make": "Chrysler",
    "model": "Cirrus",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2004,
    "make": "Chrysler",
    "model": "Concorde",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2008,
    "make": "Chrysler",
    "model": "Crossfire",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2001,
    "make": "Chrysler",
    "model": "LHS",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2008,
    "make": "Chrysler",
    "model": "Pacific",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2002,
    "make": "Chrysler",
    "model": "Prowler",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2010,
    "make": "Chrysler",
    "model": "PT Cruiser",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2011,
    "make": "Chrysler",
    "model": "Sebring",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Chrysler",
    "model": "Town & Country",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2003,
    "make": "Chrysler",
    "model": "Voyager",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1999,
    "yearTo": 2002,
    "make": "Daewoo",
    "model": "Lanos",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1999,
    "yearTo": 2002,
    "make": "Daewoo",
    "model": "Leganza",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1999,
    "yearTo": 2002,
    "make": "Daewoo",
    "model": "Nubir",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Dodge",
    "model": "Avenger",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2011,
    "make": "Dodge",
    "model": "Caliber",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Dodge",
    "model": "Caravan/Grand Caravan",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2008,
    "yearTo": 2014,
    "make": "Dodge",
    "model": "Challenger",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2014,
    "make": "Dodge",
    "model": "Charger",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2012,
    "make": "Dodge",
    "model": "Dakot",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1998,
    "yearTo": 2012,
    "make": "Dodge",
    "model": "Durango",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2004,
    "make": "Dodge",
    "model": "Intrepid",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2009,
    "yearTo": 2012,
    "make": "Dodge",
    "model": "Journey",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2008,
    "make": "Dodge",
    "model": "Magnum",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2005,
    "make": "Dodge",
    "model": "Neon",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2012,
    "make": "Dodge",
    "model": "Nitro",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Dodge",
    "model": "RAM 1500 to 6500",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2008,
    "make": "Dodge",
    "model": "Sprinter",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2006,
    "make": "Dodge",
    "model": "Stratus",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2012,
    "make": "Dodge",
    "model": "Viper",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2011,
    "yearTo": 2014,
    "make": "Fiat",
    "model": "500",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2007,
    "make": "Ford",
    "model": "500",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 1998,
    "make": "Ford",
    "model": "Aerostar",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2007,
    "make": "Ford",
    "model": "Cab Over",
    "harnessType": "Universal",
    "comments": "You can use a 8-800 for Power only."
  },
  {
    "yearFrom": 2008,
    "yearTo": 2014,
    "make": "Ford",
    "model": "Cab Over",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2000,
    "make": "Ford",
    "model": "Contour",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Ford",
    "model": "Crown Victoria",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Ford",
    "model": "E-150 to E-550",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2012,
    "make": "Ford",
    "model": "Edge",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2014,
    "make": "Ford",
    "model": "Escape",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2003,
    "make": "Ford",
    "model": "Escort",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2000,
    "yearTo": 2005,
    "make": "Ford",
    "model": "Excursion",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Ford",
    "model": "Expedition",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Ford",
    "model": "Explorer & Explorer Trac",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Ford",
    "model": "F-150 to F-550",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1984,
    "yearTo": 2000,
    "make": "Ford",
    "model": "F-600 to F-900",
    "harnessType": "Universal",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2000,
    "make": "Ford",
    "model": "F-650 to F-750",
    "harnessType": "8-700",
    "comments": "Vehicle has both Light and Heavy Duty harness installed by the factory. In most cases this vehicle will take a 8-700 Square."
  },
  {
    "yearFrom": 2001,
    "yearTo": 2014,
    "make": "Ford",
    "model": "F-650 to F-750",
    "harnessType": "8-600",
    "comments": "Vehicle has both Light and Heavy Duty harness installed by the factory. In most cases this vehicle will take a 8-600."
  },
  {
    "yearFrom": 2010,
    "yearTo": 2014,
    "make": "Ford",
    "model": "Fiesta",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2009,
    "yearTo": 2014,
    "make": "Ford",
    "model": "Flex",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2000,
    "yearTo": 2014,
    "make": "Ford",
    "model": "Focus",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2007,
    "make": "Ford",
    "model": "Freest",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2008,
    "make": "Ford",
    "model": "Freestyle",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2014,
    "make": "Ford",
    "model": "Fusion",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2007,
    "make": "Ford",
    "model": "GT",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1970,
    "yearTo": 1996,
    "make": "Ford",
    "model": "L-Series",
    "harnessType": "Universal",
    "comments": ""
  },
  {
    "yearFrom": null,
    "yearTo": 2007,
    "make": "Ford",
    "model": "LCF",
    "harnessType": "8-800",
    "comments": "You can use a 8-800 for Power only. We do not support diagnostics for these years"
  },
  {
    "yearFrom": 2008,
    "yearTo": 2014,
    "make": "Ford",
    "model": "LCF",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Ford",
    "model": "Mustang",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2012,
    "make": "Ford",
    "model": "Ranger",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2011,
    "make": "Ford",
    "model": "Sport Trac",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Ford",
    "model": "Taurus",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2005,
    "make": "Ford",
    "model": "Thunderbird",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2010,
    "yearTo": 2014,
    "make": "Ford",
    "model": "Transit Connect",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2004,
    "make": "Ford",
    "model": "Windstar",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1994,
    "yearTo": 2003,
    "make": "Freightliner",
    "model": "All Models",
    "harnessType": "8-700",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2008,
    "make": "Freightliner",
    "model": "All Models",
    "harnessType": "8-600",
    "comments": ""
  },
  {
    "yearFrom": 2009,
    "yearTo": 2013,
    "make": "Freightliner",
    "model": "All Models",
    "harnessType": "8-600D",
    "comments": ""
  },
  {
    "yearFrom": 2014,
    "yearTo": 2014,
    "make": "Freightliner",
    "model": "All Models",
    "harnessType": "8-600",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2014,
    "make": "Freightliner",
    "model": "Sprinter",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2015,
    "yearTo": 2017,
    "make": "Freightliner",
    "model": "All Models",
    "harnessType": "8-600",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2007,
    "make": "GMC",
    "model": "W-Series",
    "harnessType": "Universal",
    "comments": "You can use a 8-800 for Power only."
  },
  {
    "yearFrom": 2008,
    "yearTo": 2014,
    "make": "GMC",
    "model": "W-Series",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2014,
    "make": "GMC",
    "model": "Acadi",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "GMC",
    "model": "C4500 to C6500",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2002,
    "make": "GMC",
    "model": "C7500 to C8500",
    "harnessType": "Universal",
    "comments": "8-800 can be used for Power Only."
  },
  {
    "yearFrom": 2003,
    "yearTo": 2005,
    "make": "GMC",
    "model": "C7500 to C8500",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2014,
    "make": "GMC",
    "model": "C7500 to C8500",
    "harnessType": "8-600",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2014,
    "make": "GMC",
    "model": "Canyon",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1999,
    "yearTo": 2014,
    "make": "GMC",
    "model": "Envoy",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2005,
    "make": "GMC",
    "model": "Safari",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "GMC",
    "model": "Savan",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1998,
    "yearTo": 2014,
    "make": "GMC",
    "model": "Sierra",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2004,
    "make": "GMC",
    "model": "Sonoma",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "GMC",
    "model": "Suburban",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2007,
    "make": "GMC",
    "model": "T-Series",
    "harnessType": "Universal",
    "comments": "You can use a 8-800 for Power only."
  },
  {
    "yearFrom": 2008,
    "yearTo": 2014,
    "make": "GMC",
    "model": "T-Series",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2009,
    "yearTo": 2014,
    "make": "GMC",
    "model": "Terrain",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2007,
    "make": "GMC",
    "model": "W-Series",
    "harnessType": "Universal",
    "comments": "You can use a 8-800 for Power only."
  },
  {
    "yearFrom": 2008,
    "yearTo": 2014,
    "make": "GMC",
    "model": "W-Series",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "GMC",
    "model": "Yukon",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1991,
    "yearTo": 2007,
    "make": "Hino",
    "model": "Class 1 to 5",
    "harnessType": "Universal",
    "comments": ""
  },
  {
    "yearFrom": 2008,
    "yearTo": 2014,
    "make": "Hino",
    "model": "Class 1 to 5",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2001,
    "make": "Hino",
    "model": "Class 6 to 7",
    "harnessType": "8-700",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2014,
    "make": "Hino",
    "model": "Class 6 to 7",
    "harnessType": "8-600",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2012,
    "make": "Hond",
    "model": "Accor",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Hond",
    "model": "Civic",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1997,
    "yearTo": 2014,
    "make": "Hond",
    "model": "CRV",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2011,
    "yearTo": 2014,
    "make": "Hond",
    "model": "CR-Z",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2012,
    "make": "Hond",
    "model": "Element",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2014,
    "make": "Hond",
    "model": "Fit",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2000,
    "yearTo": 2012,
    "make": "Hond",
    "model": "Insight",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Hond",
    "model": "Odyssey",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2002,
    "make": "Hond",
    "model": "Passport",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2012,
    "make": "Hond",
    "model": "Pilot",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2001,
    "make": "Hond",
    "model": "Prelude",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2012,
    "make": "Hond",
    "model": "Ridgeline",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2000,
    "yearTo": 2009,
    "make": "Hond",
    "model": "S2000",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1998,
    "yearTo": 2004,
    "make": "Hummer",
    "model": "H1",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2011,
    "make": "Hummer",
    "model": "H2",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2011,
    "make": "Hummer",
    "model": "H3",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2012,
    "make": "Hyundai",
    "model": "Accent",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2014,
    "make": "Hyundai",
    "model": "Azera",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Hyundai",
    "model": "Elantr",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2010,
    "make": "Hyundai",
    "model": "Entourage",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2011,
    "yearTo": 2014,
    "make": "Hyundai",
    "model": "Equus",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2009,
    "yearTo": 2014,
    "make": "Hyundai",
    "model": "Genesis",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2014,
    "make": "Hyundai",
    "model": "Santa Fe",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Hyundai",
    "model": "Sonat",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2008,
    "make": "Hyundai",
    "model": "Tiburon",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2012,
    "make": "Hyundai",
    "model": "Tucson",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2012,
    "yearTo": 2014,
    "make": "Hyundai",
    "model": "Veloster",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2012,
    "make": "Hyundai",
    "model": "Veracruz",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2014,
    "make": "IC Corporation",
    "model": "All Models",
    "harnessType": "8-600",
    "comments": ""
  },
  {
    "yearFrom": 2008,
    "yearTo": 2012,
    "make": "Infiniti",
    "model": "EX35",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2014,
    "make": "Infiniti",
    "model": "FX35",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2008,
    "make": "Infiniti",
    "model": "FX45",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2009,
    "yearTo": 2012,
    "make": "Infiniti",
    "model": "FX50",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2002,
    "make": "Infiniti",
    "model": "G20",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2011,
    "yearTo": 2014,
    "make": "Infiniti",
    "model": "G25",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2008,
    "make": "Infiniti",
    "model": "G35",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2008,
    "yearTo": 2014,
    "make": "Infiniti",
    "model": "G37",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2012,
    "yearTo": 2014,
    "make": "Infiniti",
    "model": "JX35",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2010,
    "make": "Infiniti",
    "model": "M35",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2011,
    "yearTo": 2012,
    "make": "Infiniti",
    "model": "M37",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2010,
    "make": "Infiniti",
    "model": "M45",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2011,
    "yearTo": 2012,
    "make": "Infiniti",
    "model": "M56",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2006,
    "make": "Infiniti",
    "model": "Q45",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2004,
    "make": "Infiniti",
    "model": "QX4",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2012,
    "make": "Infiniti",
    "model": "QX56",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1995,
    "yearTo": 2000,
    "make": "International",
    "model": "All Models",
    "harnessType": "8-700",
    "comments": ""
  },
  {
    "yearFrom": 2000,
    "yearTo": 2017,
    "make": "International",
    "model": "All Models",
    "harnessType": "8-600",
    "comments": ""
  },
  {
    "yearFrom": 1998,
    "yearTo": 2000,
    "make": "Isuzu",
    "model": "Amigo",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2008,
    "make": "Isuzu",
    "model": "Ascender",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2005,
    "make": "Isuzu",
    "model": "Axiom",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2007,
    "make": "Isuzu",
    "model": "NPR",
    "harnessType": "Universal",
    "comments": "You can use a 8-800 for Power only."
  },
  {
    "yearFrom": 2008,
    "yearTo": 2014,
    "make": "Isuzu",
    "model": "NPR",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2004,
    "make": "Isuzu",
    "model": "Rodeo",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2002,
    "make": "Isuzu",
    "model": "Trooper",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2000,
    "yearTo": 2008,
    "make": "Jaguar",
    "model": "S-Type",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2008,
    "yearTo": 2012,
    "make": "Jaguar",
    "model": "XF",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2010,
    "make": "Jaguar",
    "model": "XJ Series",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1998,
    "yearTo": 2004,
    "make": "Jaguar",
    "model": "XJ8",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2004,
    "make": "Jaguar",
    "model": "XJR",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2012,
    "make": "Jaguar",
    "model": "XK Series",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2009,
    "make": "Jaguar",
    "model": "X-Type",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2002,
    "make": "Jeep",
    "model": "Cherokee",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2008,
    "yearTo": 2011,
    "make": "Jeep",
    "model": "Commander",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2011,
    "make": "Jeep",
    "model": "Compass",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2012,
    "make": "Jeep",
    "model": "Grand Cherokee",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2012,
    "make": "Jeep",
    "model": "Libert",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2012,
    "make": "Jeep",
    "model": "Patriot",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2012,
    "make": "Jeep",
    "model": "Wrangler",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1994,
    "yearTo": 2000,
    "make": "Kenworth",
    "model": "All Models",
    "harnessType": "8-700",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2008,
    "make": "Kenworth",
    "model": "All Models",
    "harnessType": "8-600D",
    "comments": ""
  },
  {
    "yearFrom": 2009,
    "yearTo": 2015,
    "make": "Kenworth",
    "model": "All Models",
    "harnessType": "8-600D",
    "comments": ""
  },
  {
    "yearFrom": 2015,
    "yearTo": 2016,
    "make": "Kenworth",
    "model": "All Models",
    "harnessType": "8-600",
    "comments": ""
  },
  {
    "yearFrom": 2017,
    "yearTo": 2018,
    "make": "Kenworth",
    "model": "All Models",
    "harnessType": "8-600 (Modified Harness required only when using with 87B device.)",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2009,
    "make": "Kia",
    "model": "Amanti",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2009,
    "yearTo": 2011,
    "make": "Kia",
    "model": "Borrego",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2010,
    "yearTo": 2014,
    "make": "Kia",
    "model": "Forte",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2014,
    "make": "Kia",
    "model": "Optim",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2012,
    "make": "Kia",
    "model": "Rio",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2014,
    "make": "Kia",
    "model": "Rondo",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2012,
    "make": "Kia",
    "model": "Sedon",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2001,
    "make": "Kia",
    "model": "Sephi",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2014,
    "make": "Kia",
    "model": "Sorento",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2010,
    "yearTo": 2014,
    "make": "Kia",
    "model": "Soul",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2000,
    "yearTo": 2009,
    "make": "Kia",
    "model": "Spectr",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Kia",
    "model": "Sportage",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2011,
    "yearTo": 2014,
    "make": "Lamborghini",
    "model": "Aventador",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2014,
    "make": "Lamborghini",
    "model": "Gallardo",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2014,
    "make": "Lamborghini",
    "model": "Murcielago",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2004,
    "make": "Land Rover",
    "model": "Discovery",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2005,
    "make": "Land Rover",
    "model": "Freelander",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2008,
    "yearTo": 2012,
    "make": "Land Rover",
    "model": "LR2",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2010,
    "make": "Land Rover",
    "model": "LR3",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2012,
    "make": "Land Rover",
    "model": "Range Rover",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2011,
    "yearTo": 2014,
    "make": "Lexus",
    "model": "CT 200H",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2003,
    "make": "Lexus",
    "model": "ES 300 & 350",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2006,
    "make": "Lexus",
    "model": "GS 300",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2014,
    "make": "Lexus",
    "model": "GS 350",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1998,
    "yearTo": 2000,
    "make": "Lexus",
    "model": "GS 400",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2007,
    "make": "Lexus",
    "model": "GS 430",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2012,
    "make": "Lexus",
    "model": "GS 450H",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2008,
    "yearTo": 2012,
    "make": "Lexus",
    "model": "GS 460",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2010,
    "yearTo": 2014,
    "make": "Lexus",
    "model": "GX 460",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2009,
    "make": "Lexus",
    "model": "GX 470",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2010,
    "yearTo": 2014,
    "make": "Lexus",
    "model": "HS 250H",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2014,
    "make": "Lexus",
    "model": "IS 250",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2005,
    "make": "Lexus",
    "model": "IS 300",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2014,
    "make": "Lexus",
    "model": "IS 350",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2008,
    "yearTo": 2014,
    "make": "Lexus",
    "model": "IS F",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2012,
    "yearTo": 2014,
    "make": "Lexus",
    "model": "LFA",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2000,
    "make": "Lexus",
    "model": "LS 400",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2006,
    "make": "Lexus",
    "model": "LS 430",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2014,
    "make": "Lexus",
    "model": "LS 460",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2008,
    "yearTo": 2012,
    "make": "Lexus",
    "model": "LS 600H",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1998,
    "yearTo": 2007,
    "make": "Lexus",
    "model": "LX 470",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2008,
    "yearTo": 2014,
    "make": "Lexus",
    "model": "LX 570",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1999,
    "yearTo": 2003,
    "make": "Lexus",
    "model": "RX 300",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2006,
    "make": "Lexus",
    "model": "RX 330",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2014,
    "make": "Lexus",
    "model": "RX 350",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2008,
    "make": "Lexus",
    "model": "RX 400H",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2010,
    "yearTo": 2014,
    "make": "Lexus",
    "model": "RX 450H",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2000,
    "make": "Lexus",
    "model": "SC 300 & 400",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2010,
    "make": "Lexus",
    "model": "SC 430",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2005,
    "make": "Lincoln",
    "model": "Aviator",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2002,
    "make": "Lincoln",
    "model": "Blackwood",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2003,
    "make": "Lincoln",
    "model": "Continental",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2000,
    "yearTo": 2007,
    "make": "Lincoln",
    "model": "LS",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2009,
    "make": "Lincoln",
    "model": "Mark LT",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2009,
    "yearTo": 2012,
    "make": "Lincoln",
    "model": "MKS",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2009,
    "yearTo": 2014,
    "make": "Lincoln",
    "model": "MKT",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2014,
    "make": "Lincoln",
    "model": "MKX",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2014,
    "make": "Lincoln",
    "model": "MKZ",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1998,
    "yearTo": 2014,
    "make": "Lincoln",
    "model": "Navigator",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2012,
    "make": "Lincoln",
    "model": "Town Car",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2006,
    "make": "Lincoln",
    "model": "Zephyr",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1984,
    "yearTo": 1995,
    "make": "Mack",
    "model": "All Models",
    "harnessType": "Universal",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2003,
    "make": "Mack",
    "model": "All Models",
    "harnessType": "8-700",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2013,
    "make": "Mack",
    "model": "All Models",
    "harnessType": "8-600",
    "comments": ""
  },
  {
    "yearFrom": 2014,
    "yearTo": 2017,
    "make": "Mack",
    "model": "All Models",
    "harnessType": "8-800 Mack/Volvo",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2003,
    "make": "Mazd",
    "model": "626",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2009,
    "make": "Mazd",
    "model": "B-Series",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2012,
    "yearTo": 2014,
    "make": "Mazd",
    "model": "CX-5",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2014,
    "make": "Mazd",
    "model": "CX-7",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2014,
    "make": "Mazd",
    "model": "CX-9",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2011,
    "yearTo": 2012,
    "make": "Mazd",
    "model": "Mazda2",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2011,
    "make": "Mazd",
    "model": "Mazda3",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2012,
    "make": "Mazd",
    "model": "Mazda5",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2012,
    "make": "Mazd",
    "model": "Mazda6",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2006,
    "make": "Mazd",
    "model": "Miata",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2002,
    "make": "Mazd",
    "model": "Millenia",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2006,
    "make": "Mazd",
    "model": "MPV",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2011,
    "make": "Mazd",
    "model": "MX-5 Miata",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2003,
    "make": "Mazd",
    "model": "Protégé",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2003,
    "make": "Mazd",
    "model": "Protege5",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2011,
    "make": "Mazd",
    "model": "RX-8",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2011,
    "make": "Mazd",
    "model": "Tribute",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1997,
    "yearTo": 2000,
    "make": "Mercedes Benz",
    "model": "C 230",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2000,
    "make": "Mercedes Benz",
    "model": "C 280",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2007,
    "make": "Mercedes Benz",
    "model": "C 320",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Mercedes Benz",
    "model": "C Class",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2006,
    "make": "Mercedes Benz",
    "model": "CL 500",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2012,
    "make": "Mercedes Benz",
    "model": "CL 550",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2006,
    "make": "Mercedes Benz",
    "model": "CL 55 AMG",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2006,
    "make": "Mercedes Benz",
    "model": "CL 600",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2007,
    "make": "Mercedes Benz",
    "model": "CL 65 AMG",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2012,
    "make": "Mercedes Benz",
    "model": "CLK",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1998,
    "yearTo": 2006,
    "make": "Mercedes Benz",
    "model": "CLS",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2002,
    "make": "Mercedes Benz",
    "model": "E-Class",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2014,
    "make": "Mercedes Benz",
    "model": "E-Class",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2011,
    "make": "Mercedes Benz",
    "model": "G Class",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2012,
    "make": "Mercedes Benz",
    "model": "GL Class",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2014,
    "make": "Mercedes Benz",
    "model": "GLK Class",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1998,
    "yearTo": 2005,
    "make": "Mercedes Benz",
    "model": "ML-Class",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2012,
    "make": "Mercedes Benz",
    "model": "ML-Class",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2012,
    "make": "Mercedes Benz",
    "model": "R-Class",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2001,
    "make": "Mercedes Benz",
    "model": "S 320",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2000,
    "yearTo": 2006,
    "make": "Mercedes Benz",
    "model": "S 430",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2013,
    "make": "Mercedes Benz",
    "model": "S 500",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2013,
    "make": "Mercedes Benz",
    "model": "S 550",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2006,
    "make": "Mercedes Benz",
    "model": "S 55 AMG",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2006,
    "make": "Mercedes Benz",
    "model": "S 600",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2013,
    "make": "Mercedes Benz",
    "model": "S 600",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2006,
    "make": "Mercedes Benz",
    "model": "S 65 AMG",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2011,
    "make": "Mercedes Benz",
    "model": "SLK",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2014,
    "make": "Mercedes Benz",
    "model": "SL-Series",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2011,
    "make": "Mercedes Benz",
    "model": "SLK",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2014,
    "make": "Mercedes Benz",
    "model": "Sprinter",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2000,
    "make": "Mercury",
    "model": "Cougar",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2011,
    "make": "Mercury",
    "model": "Grand Marquis",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2007,
    "make": "Mercury",
    "model": "Mariner",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2007,
    "make": "Mercury",
    "model": "Montego",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2007,
    "make": "Mercury",
    "model": "Monterey",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2002,
    "make": "Mercury",
    "model": "Mountaineer",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2005,
    "make": "Mercury",
    "model": "Mystique",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2010,
    "make": "Mercury",
    "model": "Sable",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2000,
    "make": "Mercury",
    "model": "Tracer",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2002,
    "make": "Mercury",
    "model": "Villager",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2014,
    "make": "Mini",
    "model": "Cooper",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2004,
    "make": "Mitsubishi",
    "model": "Diamante",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2012,
    "make": "Mitsubishi",
    "model": "Eclipse",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2012,
    "make": "Mitsubishi",
    "model": "Endeavor",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2006,
    "make": "Mitsubishi",
    "model": "Galant",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2014,
    "make": "Mitsubishi",
    "model": "Lancer",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2003,
    "make": "Mitsubishi",
    "model": "Mirage",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2006,
    "make": "Mitsubishi",
    "model": "Montero",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2012,
    "make": "Mitsubishi",
    "model": "Montero Sport",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2014,
    "make": "Mitsubishi",
    "model": "Outlander",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2012,
    "make": "Mitsubishi",
    "model": "Raider",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2002,
    "make": "Mitsubishi",
    "model": "3000GT",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2012,
    "make": "Nissan",
    "model": "200SX",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Nissan",
    "model": "240SX",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Nissan",
    "model": "300ZX",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Nissan",
    "model": "350Z",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2009,
    "yearTo": 2014,
    "make": "Nissan",
    "model": "370Z",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2012,
    "make": "Nissan",
    "model": "Altima",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2014,
    "make": "Nissan",
    "model": "Armada",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2012,
    "make": "Nissan",
    "model": "Cube",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Nissan",
    "model": "Frontier",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2009,
    "make": "Nissan",
    "model": "Murano",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Nissan",
    "model": "Pathfinder",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2014,
    "make": "Nissan",
    "model": "Quest",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2011,
    "yearTo": 2014,
    "make": "Nissan",
    "model": "Rogue",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2004,
    "make": "Nissan",
    "model": "Sentra",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2014,
    "make": "Nissan",
    "model": "Titan",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2008,
    "yearTo": 2012,
    "make": "Nissan",
    "model": "Versa",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2012,
    "make": "Nissan",
    "model": "Xterra",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2002,
    "make": "Oldsmobile",
    "model": "Achieva",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2004,
    "make": "Oldsmobile",
    "model": "Alero",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2004,
    "make": "Oldsmobile",
    "model": "Aurora",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1998,
    "yearTo": 2002,
    "make": "Oldsmobile",
    "model": "Bravada",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2000,
    "make": "Oldsmobile",
    "model": "Cutlass",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1997,
    "yearTo": 2004,
    "make": "Oldsmobile",
    "model": "Intrigue",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2004,
    "make": "Oldsmobile",
    "model": "Silhouette",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1994,
    "yearTo": 2005,
    "make": "Peterbuilt",
    "model": "All Models",
    "harnessType": "8-700",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2014,
    "make": "Peterbuilt",
    "model": "All Models",
    "harnessType": "8-600D",
    "comments": ""
  },
  {
    "yearFrom": 2015,
    "yearTo": 2017,
    "make": "Peterbuilt",
    "model": "All Models",
    "harnessType": "8-600",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2000,
    "make": "Plymouth",
    "model": "Breeze",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2001,
    "make": "Plymouth",
    "model": "Neon",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2000,
    "make": "Plymouth",
    "model": "Voyager",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2010,
    "make": "Pontiac",
    "model": "Bonneville",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2005,
    "make": "Pontiac",
    "model": "Firebird",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2010,
    "make": "Pontiac",
    "model": "G5",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2010,
    "make": "Pontiac",
    "model": "G6",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2008,
    "yearTo": 2009,
    "make": "Pontiac",
    "model": "G8",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2008,
    "make": "Pontiac",
    "model": "GTO",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2005,
    "make": "Pontiac",
    "model": "Grand Am",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2009,
    "make": "Pontiac",
    "model": "Grand Prix",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1999,
    "yearTo": 2006,
    "make": "Pontiac",
    "model": "Montana",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2008,
    "make": "Pontiac",
    "model": "Pursuit",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2010,
    "make": "Pontiac",
    "model": "Solstice",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2005,
    "make": "Pontiac",
    "model": "Sunfire",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2009,
    "make": "Pontiac",
    "model": "Torrent",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2009,
    "make": "Pontiac",
    "model": "Vibe",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2014,
    "make": "Porsche",
    "model": "911",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2014,
    "make": "Porsche",
    "model": "Boxster",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2014,
    "make": "Porsche",
    "model": "Carrera",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2014,
    "make": "Porsche",
    "model": "Cayenne",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2014,
    "make": "Porsche",
    "model": "Cayman",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2010,
    "yearTo": 2014,
    "make": "Porsche",
    "model": "Panamera",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2000,
    "yearTo": 2006,
    "make": "Saab",
    "model": "9-2x",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Saab",
    "model": "9-3",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Saab",
    "model": "9-5",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2009,
    "make": "Saab",
    "model": "9-7x",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2005,
    "make": "Saturn",
    "model": "Astra",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2008,
    "yearTo": 2009,
    "make": "Saturn",
    "model": "Aura",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2010,
    "make": "Saturn",
    "model": "ION",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2007,
    "make": "Saturn",
    "model": "L-Series",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2000,
    "yearTo": 2005,
    "make": "Saturn",
    "model": "Outlook",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2008,
    "yearTo": 2010,
    "make": "Saturn",
    "model": "Relay",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2007,
    "make": "Saturn",
    "model": "S-Series",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2002,
    "make": "Saturn",
    "model": "Sky",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2009,
    "make": "Saturn",
    "model": "Vue",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2010,
    "make": "Scion",
    "model": "tC",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2012,
    "make": "Scion",
    "model": "xA",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2007,
    "make": "Scion",
    "model": "xB",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2008,
    "yearTo": 2012,
    "make": "Scion",
    "model": "xD",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2003,
    "make": "Sterling",
    "model": "All Models",
    "harnessType": "8-700",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2009,
    "make": "Sterling",
    "model": "All Models",
    "harnessType": "8-600",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2002,
    "make": "Subaru",
    "model": "Baja",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2006,
    "make": "Subaru",
    "model": "Forester",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Subaru",
    "model": "Impreza",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Subaru",
    "model": "Legacy",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Subaru",
    "model": "Outback",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2009,
    "yearTo": 2014,
    "make": "Subaru",
    "model": "Tribeca",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2010,
    "yearTo": 2012,
    "make": "Subaru",
    "model": "WRX",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2000,
    "make": "Suzuki",
    "model": "Esteem",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2008,
    "make": "Suzuki",
    "model": "Forenza",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2012,
    "make": "Suzuki",
    "model": "Grand Vitara",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2007,
    "make": "Suzuki",
    "model": "Reno",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2006,
    "make": "Suzuki",
    "model": "Sidekick",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2001,
    "make": "Suzuki",
    "model": "Swift",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2002,
    "yearTo": 2006,
    "make": "Suzuki",
    "model": "Swift",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1999,
    "yearTo": 2005,
    "make": "Suzuki",
    "model": "Vitara",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2012,
    "make": "Suzuki",
    "model": "Verona",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2011,
    "make": "Suzuki",
    "model": "XL-7",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Toyota",
    "model": "4Runner",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Toyota",
    "model": "Avalon",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Toyota",
    "model": "Camry",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2001,
    "yearTo": 2005,
    "make": "Toyota",
    "model": "Celica",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Toyota",
    "model": "Corolla",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2014,
    "make": "Toyota",
    "model": "FJ Cruiser",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2000,
    "yearTo": 2014,
    "make": "Toyota",
    "model": "Highlander",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Toyota",
    "model": "Land Cruiser",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2000,
    "yearTo": 2010,
    "make": "Toyota",
    "model": "MR2",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2008,
    "yearTo": 2014,
    "make": "Toyota",
    "model": "Matrix",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2000,
    "yearTo": 2006,
    "make": "Toyota",
    "model": "Prius",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2014,
    "make": "Toyota",
    "model": "Rav4",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2014,
    "make": "Toyota",
    "model": "Sequoia",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Toyota",
    "model": "Sienna",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2000,
    "yearTo": 2007,
    "make": "Toyota",
    "model": "Solara",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2000,
    "make": "Toyota",
    "model": "Supra",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Toyota",
    "model": "Tacoma",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2000,
    "yearTo": 2014,
    "make": "Toyota",
    "model": "Tundra",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2007,
    "yearTo": 2014,
    "make": "Toyota",
    "model": "Yaris",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1994,
    "yearTo": 2005,
    "make": "UD Nissan Diesel",
    "model": "All Models",
    "harnessType": "8-600",
    "comments": ""
  },
  {
    "yearFrom": 2006,
    "yearTo": 2008,
    "make": "UD Nissan Diesel",
    "model": "All Models",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2009,
    "yearTo": 2014,
    "make": "UD Nissan Diesel",
    "model": "All Models",
    "harnessType": "8-600",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2014,
    "make": "Volkswagen",
    "model": "Beetle",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2009,
    "yearTo": 2014,
    "make": "Volkswagen",
    "model": "CC",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2005,
    "yearTo": 2014,
    "make": "Volkswagen",
    "model": "EOS",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Volkswagen",
    "model": "Golf",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Volkswagen",
    "model": "GTI",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Volkswagen",
    "model": "Jetta",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2014,
    "make": "Volkswagen",
    "model": "Passat",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2014,
    "make": "Volkswagen",
    "model": "Rabbit",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2009,
    "yearTo": 2014,
    "make": "Volkswagen",
    "model": "Routan",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2014,
    "make": "Volkswagen",
    "model": "Tiguan",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2004,
    "yearTo": 2014,
    "make": "Volkswagen",
    "model": "Touareg",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 1996,
    "yearTo": 2002,
    "make": "Volvo",
    "model": "All Models",
    "harnessType": "8-800",
    "comments": ""
  },
  {
    "yearFrom": 2003,
    "yearTo": 2014,
    "make": "Volvo",
    "model": "All Models",
    "harnessType": "8-800 Mack/Volvo",
    "comments": ""
  }
];

export async function seedHarnesses() {
  try {
    // Check if harnesses already exist
    const result = await db.select({ count: count() }).from(harnesses);
    const existingCount = Number(result[0]?.count || 0);
    
    if (existingCount > 0) {
      console.log(`Harness data already exists (${existingCount} records). Skipping seed.`);
      return;
    }
    
    console.log(`Seeding ${harnessData.length} harness records...`);
    
    // Insert seed data in batches
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < harnessData.length; i += batchSize) {
      const batch = harnessData.slice(i, i + batchSize);
      await db.insert(harnesses).values(batch);
      inserted += batch.length;
    }
    
    console.log(`✅ Seeded ${inserted} harness records successfully`);
  } catch (error) {
    console.error('Error seeding harnesses:', error);
  }
}
