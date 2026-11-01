import type { LocatorPoint } from "../../db/schema";
import type { AddressSuggestion } from "./domain";
export type ClientPoint=Omit<LocatorPoint,"createdAt"|"updatedAt"|"deletedAt"|"confirmedAt">&{
 createdAt:string;updatedAt:string;deletedAt:string|null;confirmedAt:string|null;
};
export type AutocompleteOption=AddressSuggestion;
export type CityPartner={id:number;name:string;address:string;city:string;state:string;postalCode:string;isDemo:boolean;mapsUrl:string};
export type SearchResult={
 radiusKm:30|50|100;
 total:number;
 hasMore:boolean;
 origin:{latitude:number;longitude:number;label:string;precision:string|null;approximate:boolean;source:string;city:string|null;state:string|null};
 points:Array<{id:number;name:string;address:string;city:string;state:string;postalCode:string;isDemo:boolean;distanceKm:number;mapsUrl:string}>;
 cityPartners:CityPartner[];
};

