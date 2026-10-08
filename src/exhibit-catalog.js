export const exhibitCatalog=[
 ['chair','Sedia con schienale','Arredi',.5,.85,.55,'armchair','#967552'],
 ['stool','Sgabello','Arredi',.4,.48,.4,'armchair','#bca07b'],
 ['round-table','Tavolo rotondo','Arredi',1.1,.75,1.1,'table-2','#bca07b'],
 ['sofa','Divanetto','Arredi',1.8,.8,.8,'armchair','#748279'],
 ['shelf','Scaffale a giorno','Arredi',1.2,1.8,.35,'layout-panel-top','#a28561'],
 ['round-plinth','Piedistallo cilindrico','Strutture',.6,.9,.6,'columns-3','#eee9dc'],
 ['display-table','Tavolo espositivo','Strutture',1.6,.85,.8,'table-2','#e4dfd3'],
 ['display-case','Vetrina verticale','Strutture',.8,1.9,.6,'box','#d9d5ca'],
 ['rope-barrier','Dissuasori con cordone','Strutture',1.8,1,.32,'columns-2','#3d4643'],
 ['easel','Cavalletto espositivo','Strutture',.65,1.7,.6,'panel-top','#aa8158'],
 ['lectern','Leggio','Comunicazione',.55,1.1,.45,'text','#586965'],
 ['kiosk','Totem interattivo','Multimedia',.6,1.65,.35,'monitor-play','#343d3b']
].map(([id,name,category,w,h,d,icon,color])=>({type:'exhibit-'+id,name,category,w,h,d,icon,color,y:0}));
