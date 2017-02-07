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
