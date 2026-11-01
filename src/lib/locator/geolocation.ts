export function geolocationErrorMessage(code:number){
 return code===1?"Permissão de localização negada. Você pode digitar um endereço ou CEP.":code===3?"A localização demorou para responder. Tente novamente ou digite um endereço.":"Não foi possível determinar sua localização. Digite um endereço ou CEP.";
}

