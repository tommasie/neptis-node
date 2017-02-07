 ;; *** problema citta *** 
(define (problem visita_citta) 
(:domain neptis) 
(:objects 
moderno - categoria 
antico - categoria 
start - area 
bracciano - area
museo_civico - attrazione 
castello_odescalchi - attrazione
casa - attrazione
 ) 
;; *** start init part (made by user app) ***
(:init
(inside museo_civico bracciano)
(inside castello_odescalchi bracciano)
(inside casa bracciano)
(categoria museo_civico antico)
(categoria castello_odescalchi antico)
(categoria casa antico)
(=(tcoda museo_civico ) 1)
(=(tcoda castello_odescalchi ) 2)
(=(tvisita museo_civico ) 30)
(=(tvisita castello_odescalchi ) 30)
(=(tmoveAA start castello_odescalchi) 24)
(=(tmoveAA start museo_civico) 23)
(=(tmoveAA start casa) 1)
(=(tmoveAt museo_civico Castello_Odescalchi ) 1)
(=(tmoveAt castello_odescalchi Museo_Civico ) 1)
(=(tmoveAt museo_civico Casa ) 26)
(=(tmoveAt casa Museo_Civico ) 26)
(=(tmoveAt museo_civico castello_odescalchi ) 1)
(=(tmoveAt castello_odescalchi museo_civico ) 1)
(=(tmoveAt museo_civico casa ) 26)
(=(tmoveAt casa museo_civico ) 26)
(=(tmoveAt museo_civico Castello_Odescalchi ) 1)
(=(tmoveAt castello_odescalchi Museo_Civico ) 1)
(=(tmoveAt museo_civico Casa ) 26)
(=(tmoveAt casa Museo_Civico ) 26)
(=(tmoveAt castello_odescalchi Casa ) 27)
(=(tmoveAt casa Castello_Odescalchi ) 27)
(neipressidi start)
(= (n) 0)
(= (total) 0)
(= (totalrating) 0)
(= (maxtime) 150)
)
(:goal
 (and (>= (n) 1) (<= (total) (maxtime)))
)
(:metric maximize (n))
)
(neipressidi start)
(= (n) 0)
(= (total) 0)
(= (totalrating) 0)
(= (maxtime) 150)
)
(:goal
 (and (>= (n) 1) (<= (total) (maxtime)))
)
(:metric maximize (n))
)
(neipressidi start)
(= (n) 0)
(= (total) 0)
(= (totalrating) 0)
(= (maxtime) 150)
)
(:goal
 (and (>= (n) 1) (<= (total) (maxtime)))
)
(:metric maximize (n))
)
