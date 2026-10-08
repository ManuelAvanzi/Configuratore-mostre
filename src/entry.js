if(location.pathname==='/templates'||location.pathname==='/templates/'){import('./templates.js');}else if(location.pathname==='/account'||location.pathname==='/account/'){
 document.title='exhibitionLab — I miei progetti';
 import('./account.js');
}else if(location.pathname==='/studio'||location.pathname==='/studio/'){
 document.title='exhibitionLab — Studio espositivo';
 import('./main.js');
}else{
 import('./landing.js');
}
