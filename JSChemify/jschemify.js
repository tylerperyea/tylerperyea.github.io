/**
JSChemify - a "pretty okay" basic cheminformatics library
written in native javascript.

TODO:

Refactoring:
1. Use const instead of var where possible
2. Use defined types instead of bespoke decorated
   objects (or maybe not)
3. [done?] Make renderer an object 
4. [done?] Precalculate layout objects for paths (up/down/left)
5. Make some of the vectors more standardized (e.g. be consistent with directions)

Basic I/O:
1. CIP designations (R/S)
2. Read double bond geometry from smiles
3. [started] InChI parser
4. [just for fun] WLN parser 
5. Simplify Smiles
   5.1. [done] There's a bug where closing parentheses aren't always added
   5.2. [done] And some exports corrupt the smiles like
         CCn1cc(c(=O)c2ccc(nc12)C)C(=O)O
         CCn1(cc(c(=O)c2(ccc(nc(12)C))C(=O)O) 
         CCn1cc(c(=O)c2ccc(nc12)C)C(=O)O 
6. [done?] Clone molecule
7. [done] Split components
8. Make ring&chain network
9. SMARTS/query support
10. [done] Molform and weight
11. [done] Basic SDF/Smiles file reader into collection
12. [partial] Spreadsheet support?
13. Basic ECFP implementation
14. MCS support
15. Scaffold support
16. Substructure support
17. Molfile parity support
18. Molfile Chiral flag support
19. Rgroup decomposition
20. Edit distance
21. [done] fix ++ and -- reading of smiles
22. gzip base64 support for molfiles
23. [partial] molfile SGroup support
24. Improve dearomatization / aromatization
25. Add basic resolver? NCATS? GSRS? Pubchem?
26. Simple editor?
27. Simple Namer?

Coordinates and Rendering:
 1. Coordinates: Fix bridgehead support
 2. Coordinates: in-line allenes
 3. [done] charges in render
 4. Highlight atoms in render
 5. [done] Show atom map numbers in render
 6. [in progress] Add colors to render
 8. [done] Get SVG or PNG directly
 9. Coordinates: Add explicit hydrogens when 
    it makes sense for stereo
10. Coordinates: Extend/wiggle colliding atoms 
    where possible
11. [partial] Draw aromatic circles and bonds
12. [partial] Coordinates: Multiple components
13. [partial] Brackets
14. Coordinates: hex grid rings alignment
15. [partial] Coordinates: bug when 3 substituents follow 
    4 substituents
16. Coordinates: overlapping bonds issue
17. [done] Path Encoding
18. [done] Parse simplified path encoding
17. SVG Bug: clearing background
18. [done] Path Encoding wedge and hash support
19. Path encoding smiles bond order discrepency?
20. Path encoding extended angles (complements)
21. Partial clean
22. [done] Path Notation:  Multiple components
23. Place subscripts a little down
24. [done] isotopes in render
25. Path Notation: Brackets

**/

JSChemify={};
window.JSChemify = JSChemify;

/*******************************
/* BaseVectors
/*******************************
Status: WORKING

The basic directional vectors used
for doing layout and coordinate 
generation.

TODO:
1. Refactor a little.
   
*******************************/
JSChemify.BaseVectors=function(){
  const ret={};
  ret.upDiag=[Math.cos(Math.PI/4),Math.sin(Math.PI/4)];
  ret.downDiag=[ret.upDiag[0],-ret.upDiag[1]];
  ret.up=[Math.cos(Math.PI/3),Math.sin(Math.PI/3)];
  ret.down=[ret.up[0],-ret.up[1]];
  ret.forward=[1,0];
  ret.backward=[-1,0];
  ret.rightUp=[0,1];
  ret.rightDown=[0,-1];
  ret.backUp=[-ret.up[0],ret.up[1]];
  ret.backDown=[-ret.up[0],-ret.up[1]];
  ret.bangles   =[[ret.up,ret.down,ret.forward,
                   ret.backUp,ret.backDown],
                               [ret.down,ret.up,ret.forward,
                   ret.backDown,ret.backUp]];
  ret.altBangles=[[ret.rightUp,ret.rightDown,ret.forward,
                   ret.backUp,ret.backDown],
                                   [ret.rightDown,ret.rightUp,ret.forward,
                   ret.backDown,ret.backUp]];    
  ret.altBanglesR=ret.bangles;
  /*
  ret.altBanglesR=[[ret.upDiag,ret.downDiag,ret.forward,
                    ret.backward],
                                    [ret.downDiag,ret.upDiag,ret.forward,
                    ret.backward]]; 
*/
 
  return ret;
};

/*******************************
/* Shape
/*******************************
Status: IN PROGRESS

Basic utility type to do shape 
operations.

TODO:
1. intersection
2. union
3. center
4. circuscribed/inscribed circle?
   
*******************************/
JSChemify.Shape=function(arg,c){
  if(art._path)return arg;
  let ret={};
  ret._path=[];
  ret.closed=true;
  ret.toConvexHull=function(){
    let npath=JSChemify.ShapeUtils().convexHull(ret._path);
    return JSChemify.Shape(npath);
  };
  ret.intersection=function(s2){
    //TODO: intersection
  };
  ret.containsPoint=function(pt){
    //TODO: containsPoint
  };
  ret.setPath=function(p,c){
    if(typeof c !== "undefined"){
        ret._closed=c;
    }
    ret._path=p;
    return ret;
  };
  if(arg){
    return ret.setPath(arg,c);
  }
  return ret;
};

/*******************************
/* ShapeUtils
/*******************************
Status: WORKING

Basic shape-related utilities.
   
*******************************/
JSChemify.ShapeUtils=function(){
  if(JSChemify.CONSTANTS && JSChemify.CONSTANTS.SHAPE_UTILS){
      return JSChemify.CONSTANTS.SHAPE_UTILS;
  }
  let ret={}; 
  JSChemify.CONSTANTS.SHAPE_UTILS=ret;
  ret.rejection=function(pt1,pt2,pt3){
      var delta1=[pt2[0]-pt1[0],pt2[1]-pt1[1]];
      var delta2=[pt3[0]-pt2[0],pt3[1]-pt2[1]];
      if((delta1[0]===0 && delta1[1]===0) ||
         (delta2[0]===0 && delta2[1]===0)
        ){
        return null;
      }
      var rej = delta1[0]*delta2[1]-delta1[1]*delta2[0];
      return rej;
  };
  ret.getBoundingBox=function(pts, pad){
    if(typeof pad === "undefined"){
       pad=1;
    }
    if(pts && pts.length>0 && typeof (pts[0].getX) === "function"){
      pts=pts.map(pp=>[pp.getX(),pp.getY()]);
    }
    let bb= pts.map(at=>[at[0],at[1],at[0],at[1]])
               .reduce((a,b)=>{
        a[0]=Math.min(a[0],b[0]);
        a[1]=Math.min(a[1],b[1]);
        a[2]=Math.max(a[2],b[2]);
        a[3]=Math.max(a[3],b[3]);
        return a;
          },[1000,1000,-1000,-1000]);
     if(bb[0]>bb[2] || pts.length===1){
        if(pts.length===1){
           let at=pts[0];
           return [at[0]-pad,at[1]-pad,at[0]+pad,at[1]+pad];
        }
        return [-pad,-pad,pad,pad];
     }
     return bb;
  };
  ret.canonicalPathCCW=function(pts){
      let fp=pts.map((p,i)=>[p,i]).reduce((ap,bp)=>{
          let a=ap[0];
          let b=bp[0];
          if(a[0]<b[0]){
              return ap;
          }else if(b[0]<a[0]){
              return bp;
          }
          if(a[1]<b[1]){
              return ap;
          }else if(b[1]<a[1]){
              return bp;
          }
          if(ap[1]<bp[1]){
              return ap;
          }
          return bp;
      });
      let ppi=(fp[1]+pts.length-1)%pts.length;
      let npi=(fp[1]+pts.length+1)%pts.length;
      var rej=Math.sign(ret.rejection(pts[ppi],fp[0],pts[npi]));
      if(rej===0)rej=1;
      return pts.map((p,i)=>{
          return pts[(fp[1]+pts.length+rej*i)%pts.length];
      });
      
    
  };
  ret.convexHull=function(pts){
   
    //first, sort the points by the rejection to pt 0
    //
    let fp=pts[0];
    pts= pts.map((pp)=>{
                let theta = Math.atan2(pp[1]-fp[1],pp[0]-fp[0]);
                if(theta<0){
                  theta=theta+Math.PI*2;
                }
                return [theta,pp];
            })
            .sort((a,b)=>{
                let t= a[0]-b[0];
                if(t!==0)return t;
                return JSChemify.Util.sqMagVector(a[1])-JSChemify.Util.sqMagVector(b[1]);
            })
            .map(a=>a[1]);
    let max=pts.length;
    for(let j=0;j<max;j++){
      let dirP=[];
      let dirN=[];
      let prevDupe=false;
      for(let i=0;i<pts.length;i++){
        let ppoint=pts[(i+pts.length-1)%pts.length];
        let cpoint=pts[i];
        let npoint=pts[(i+1)%pts.length];
        let rej=ret.rejection(ppoint,cpoint,npoint);
        if(rej===null){
          
          if(prevDupe){
            continue;
          }
          prevDupe=true;
        }else{
          prevDupe=false;
        }
        if(rej<0){
          dirN.push(cpoint);
        }else if(rej>0){
          dirP.push(cpoint);
        }else if(rej===null){
          dirN.push(cpoint);
          dirP.push(cpoint);
        }
      }
      if(dirN.length===0)return dirP;
      if(dirP.length===0)return dirN;
      if(dirN.length>dirP.length){
        pts=dirN;
      }else{
        pts=dirP;
      }
    }
    //shouldn't ever get here
    return pts;
  };
  
  return ret;
};



/*******************************
/* PathNotation
/*******************************
Status: WORKING

Basic utility type to parse and 
process path notation for chem
layout.
   
*******************************/
JSChemify.PathNotation=function(){
    if(JSChemify.CONSTANTS && JSChemify.CONSTANTS.PATH){
      return JSChemify.CONSTANTS.PATH;
    }
    let ret={};
    ret._roundAngle=10;
    ret._roundMag=1;
    ret.expand=function(pth){
      var fpath=[];
      let regex=/([LRDSFsd][0-9.]*)([Mm][0-9.]*)*([WwHh])*/y;
      //regex.lastIndex=0;
      while(regex.lastIndex<pth.length){
        let m=regex.exec(pth);
        if(!m) throw "Unexpected Path Notation:" + pth;
        let parr=[];
        parr.push(m[1]);
        if(m[2]){
          parr[1]=m[2];
        }else{
          parr[1]="";
        }
        if(m[3]){
          parr[2]=m[3];
        }
        fpath.push(parr);
      }
      return fpath;
    };
    ret.collapse=function(pth){
          return pth.map(v=>{
                  if(v[0]==="R6"){
                    v[0]="R";
                  }else if(v[0]==="L6"){
                    v[0]="L";
                  }
                  if(v[1]==="M100" || v[1]==="m100"){
                    v[1]="";
                  }
                  if(!v[2]){
                    v[2]="";
                  }
                  return v[0]+v[1]+v[2];
              }).join("");
    };
    ret.deltaVectorFromPath=function(path){
        if(!Array.isArray(path)){
          path=ret.expand(path);
        }
        var d=path[0];
        var m=path[1];
        var ang=0;
        if(d==="S"){
            return [0,0];
        }
        if(d==="L"){
          ang=Math.PI/3;
        }else if(d==="R"){
          ang=-Math.PI/3;
        }else if(d==="F"){
          ang=0;
        }else if(d.startsWith("R") || d.startsWith("L") || d.startsWith("r") || d.startsWith("l")){
          let div=d.substr(1)-0;
          ang=2*Math.PI/div;
          if(d[0]==="R" || d[0] ==="r"){
            ang=-ang;
          }
          if(d.toLowerCase()==d){
            ang=-Math.sign(ang)*(Math.PI-Math.abs(ang))/2;
          }
        }
        //
        if(!m){
          m=1;
        }else{
          let mm=(m.substr(1)-0)/100;
          if(m[0]==="M"){
            m=1/mm;
          }else{
            m=mm;
          }
        }
        return [m*Math.cos(ang),m*Math.sin(ang)];
    };
    ret.pathFromDeltaVector=function(vec1,vec2){
       if(!vec2){
          vec2=[1,0];
       }
       var dot=vec1[0]*vec2[0] + vec1[1]*vec2[1];
       var rej=vec1[0]*vec2[1] - vec1[1]*vec2[0];
       var theta=Math.atan2(rej,dot);
       var theta2=2*theta-Math.PI;
       if(theta<0){
          theta2=2*theta+Math.PI;
       }
       
       var c=(Math.PI*2)/theta;
       var c2=(Math.PI*2)/theta2;
       var mag1=JSChemify.Util.magVector(vec1);
       var mag2=JSChemify.Util.magVector(vec2);
       var magN=mag1/mag2;
       var nm="M";
       if(magN>1){
         nm="m";
         magN=1/magN;
       }
       magN=magN*100;
       var dnm="L";
       var dnm2="l";
       if(c<0){
         dnm="R";
         c=-c;
       }
        if(c2<0){
          c2=-c2;
          dnm2="r";
        }
       var rc=Math.round(c*ret._roundAngle)/ret._roundAngle;
       var rc2=Math.round(c2*ret._roundAngle)/ret._roundAngle;
       
       if(Math.abs(rc2-c2) < Math.abs(rc-c) && false){
         //TODO: there's something wrong here
          dnm=dnm2;
          c=rc2;
          //c=rc;
       }else{
          c=rc;
       }
       magN=Math.round(magN*ret._roundMag)/ret._roundMag;
       var sig=dnm+c;
       if(c>50){
          sig="F";
       }
       if(c<-50){
          sig="F";
       }
       if((magN+"")==="NaN"){
            return ["S","M100"];
       }
       if(magN===0){
            return ["S","M100"];
       }
       return [sig, nm + magN];
    };
  
    return ret;
};

/*******************************
/* CONSTANTS
/*******************************
Status: WORKING

A set of pre-calculated things.

TODO:
1. Refactor to be more consistent
   
*******************************/
JSChemify.CONSTANTS={
  CHEM_TYPE_ATOM : 1,
  CHEM_TYPE_BOND : 2,
  CHEM_TYPE_CHEMICAL : 3,
  CHEM_TYPE_SGROUP : 4,
  
  BOND_STEREO_WEDGE : 6,
  BOND_STEREO_DASH : 1,
  BOND_STEREO_WIGGLE : 4,
  BOND_STEREO_NONE : 0,

  PATH:JSChemify.PathNotation(),
  VECTORS_BASIS:JSChemify.BaseVectors(),
  
  ELEMENTS:[
  {atomicNumber:1,symbol:"H",mass:1.007,name:"Hydrogen",period:1,group:1,valance:1,smiles:true},
  {atomicNumber:2,symbol:"He",mass:4.002,name:"Helium",period:1,group:18,valance:0},
  {atomicNumber:3,symbol:"Li",mass:6.941,name:"Lithium",period:2,group:1,valance:1},
  {atomicNumber:4,symbol:"Be",mass:9.012,name:"Beryllium",period:2,group:2,valance:2},
  {atomicNumber:5,symbol:"B",mass:10.811,name:"Boron",period:2,group:13,valance:3,smiles:true},
  {atomicNumber:6,symbol:"C",mass:12.011,name:"Carbon",period:2,group:14,valance:4,smiles:true},
  {atomicNumber:7,symbol:"N",mass:14.007,name:"Nitrogen",period:2,group:15,valance:5,smiles:true},
  {atomicNumber:8,symbol:"O",mass:15.999,name:"Oxygen",period:2,group:16,valance:6,smiles:true},
  {atomicNumber:9,symbol:"F",mass:18.998,name:"Fluorine",period:2,group:17,valance:7,smiles:true},
  {atomicNumber:10,symbol:"Ne",mass:20.18,name:"Neon",period:2,group:18,valance:8},
  {atomicNumber:11,symbol:"Na",mass:22.99,name:"Sodium",period:3,group:1,valance:1},
  {atomicNumber:12,symbol:"Mg",mass:24.305,name:"Magnesium",period:3,group:2,valance:2},
  {atomicNumber:13,symbol:"Al",mass:26.982,name:"Aluminum",period:3,group:13,valance:3},
  {atomicNumber:14,symbol:"Si",mass:28.086,name:"Silicon",period:3,group:14,valance:4},
  {atomicNumber:15,symbol:"P",mass:30.974,name:"Phosphorus",period:3,group:15,valance:5,smiles:true},
  {atomicNumber:16,symbol:"S",mass:32.065,name:"Sulfur",period:3,group:16,valance:6,smiles:true},
  {atomicNumber:17,symbol:"Cl",mass:35.453,name:"Chlorine",period:3,group:17,valance:7,smiles:true},
  {atomicNumber:18,symbol:"Ar",mass:39.948,name:"Argon",period:3,group:18,valance:8},
  {atomicNumber:19,symbol:"K",mass:39.098,name:"Potassium",period:4,group:1,valance:1},
  {atomicNumber:20,symbol:"Ca",mass:40.078,name:"Calcium",period:4,group:2,valance:2},
  {atomicNumber:21,symbol:"Sc",mass:44.956,name:"Scandium",period:4,group:3,valance:0},
  {atomicNumber:22,symbol:"Ti",mass:47.867,name:"Titanium",period:4,group:4,valance:0},
  {atomicNumber:23,symbol:"V",mass:50.942,name:"Vanadium",period:4,group:5,valance:0},
  {atomicNumber:24,symbol:"Cr",mass:51.996,name:"Chromium",period:4,group:6,valance:0},
  {atomicNumber:25,symbol:"Mn",mass:54.938,name:"Manganese",period:4,group:7,valance:0},
  {atomicNumber:26,symbol:"Fe",mass:55.845,name:"Iron",period:4,group:8,valance:0},
  {atomicNumber:27,symbol:"Co",mass:58.933,name:"Cobalt",period:4,group:9,valance:0},
  {atomicNumber:28,symbol:"Ni",mass:58.693,name:"Nickel",period:4,group:10,valance:0},
  {atomicNumber:29,symbol:"Cu",mass:63.546,name:"Copper",period:4,group:11,valance:0},
  {atomicNumber:30,symbol:"Zn",mass:65.38,name:"Zinc",period:4,group:12,valance:0},
  {atomicNumber:31,symbol:"Ga",mass:69.723,name:"Gallium",period:4,group:13,valance:3},
  {atomicNumber:32,symbol:"Ge",mass:72.64,name:"Germanium",period:4,group:14,valance:4},
  {atomicNumber:33,symbol:"As",mass:74.922,name:"Arsenic",period:4,group:15,valance:5},
  {atomicNumber:34,symbol:"Se",mass:78.96,name:"Selenium",period:4,group:16,valance:6},
  {atomicNumber:35,symbol:"Br",mass:79.904,name:"Bromine",period:4,group:17,valance:7,smiles:true},
  {atomicNumber:36,symbol:"Kr",mass:83.798,name:"Krypton",period:4,group:18,valance:8},
  {atomicNumber:37,symbol:"Rb",mass:85.468,name:"Rubidium",period:5,group:1,valance:1},
  {atomicNumber:38,symbol:"Sr",mass:87.62,name:"Strontium",period:5,group:2,valance:2},
  {atomicNumber:39,symbol:"Y",mass:88.906,name:"Yttrium",period:5,group:3,valance:0},
  {atomicNumber:40,symbol:"Zr",mass:91.224,name:"Zirconium",period:5,group:4,valance:0},
  {atomicNumber:41,symbol:"Nb",mass:92.906,name:"Niobium",period:5,group:5,valance:0},
  {atomicNumber:42,symbol:"Mo",mass:95.96,name:"Molybdenum",period:5,group:6,valance:0},
  {atomicNumber:43,symbol:"Tc",mass:98,name:"Technetium",period:5,group:7,valance:0},
  {atomicNumber:44,symbol:"Ru",mass:101.07,name:"Ruthenium",period:5,group:8,valance:0},
  {atomicNumber:45,symbol:"Rh",mass:102.906,name:"Rhodium",period:5,group:9,valance:0},
  {atomicNumber:46,symbol:"Pd",mass:106.42,name:"Palladium",period:5,group:10,valance:0},
  {atomicNumber:47,symbol:"Ag",mass:107.868,name:"Silver",period:5,group:11,valance:0},
  {atomicNumber:48,symbol:"Cd",mass:112.411,name:"Cadmium",period:5,group:12,valance:0},
  {atomicNumber:49,symbol:"In",mass:114.818,name:"Indium",period:5,group:13,valance:3},
  {atomicNumber:50,symbol:"Sn",mass:118.71,name:"Tin",period:5,group:14,valance:4},
  {atomicNumber:51,symbol:"Sb",mass:121.76,name:"Antimony",period:5,group:15,valance:5},
  {atomicNumber:52,symbol:"Te",mass:127.6,name:"Tellurium",period:5,group:16,valance:6},
  {atomicNumber:53,symbol:"I",mass:126.904,name:"Iodine",period:5,group:17,valance:7,smiles:true},
  {atomicNumber:54,symbol:"Xe",mass:131.293,name:"Xenon",period:5,group:18,valance:8},
  {atomicNumber:55,symbol:"Cs",mass:132.905,name:"Cesium",period:6,group:1,valance:1},
  {atomicNumber:56,symbol:"Ba",mass:137.327,name:"Barium",period:6,group:2,valance:2},
  {atomicNumber:57,symbol:"La",mass:138.905,name:"Lanthanum",period:6,group:3,valance:0},
  {atomicNumber:58,symbol:"Ce",mass:140.116,name:"Cerium",period:6,group:0,valance:0},
  {atomicNumber:59,symbol:"Pr",mass:140.908,name:"Praseodymium",period:6,group:0,valance:0},
  {atomicNumber:60,symbol:"Nd",mass:144.242,name:"Neodymium",period:6,group:0,valance:0},
  {atomicNumber:61,symbol:"Pm",mass:145,name:"Promethium",period:6,group:0,valance:0},
  {atomicNumber:62,symbol:"Sm",mass:150.36,name:"Samarium",period:6,group:0,valance:0},
  {atomicNumber:63,symbol:"Eu",mass:151.964,name:"Europium",period:6,group:0,valance:0},
  {atomicNumber:64,symbol:"Gd",mass:157.25,name:"Gadolinium",period:6,group:0,valance:0},
  {atomicNumber:65,symbol:"Tb",mass:158.925,name:"Terbium",period:6,group:0,valance:0},
  {atomicNumber:66,symbol:"Dy",mass:162.5,name:"Dysprosium",period:6,group:0,valance:0},
  {atomicNumber:67,symbol:"Ho",mass:164.93,name:"Holmium",period:6,group:0,valance:0},
  {atomicNumber:68,symbol:"Er",mass:167.259,name:"Erbium",period:6,group:0,valance:0},
  {atomicNumber:69,symbol:"Tm",mass:168.934,name:"Thulium",period:6,group:0,valance:0},
  {atomicNumber:70,symbol:"Yb",mass:173.054,name:"Ytterbium",period:6,group:0,valance:0},
  {atomicNumber:71,symbol:"Lu",mass:174.967,name:"Lutetium",period:6,group:0,valance:0},
  {atomicNumber:72,symbol:"Hf",mass:178.49,name:"Hafnium",period:6,group:4,valance:0},
  {atomicNumber:73,symbol:"Ta",mass:180.948,name:"Tantalum",period:6,group:5,valance:0},
  {atomicNumber:74,symbol:"W",mass:183.84,name:"Wolfram",period:6,group:6,valance:0},
  {atomicNumber:75,symbol:"Re",mass:186.207,name:"Rhenium",period:6,group:7,valance:0},
  {atomicNumber:76,symbol:"Os",mass:190.23,name:"Osmium",period:6,group:8,valance:0},
  {atomicNumber:77,symbol:"Ir",mass:192.217,name:"Iridium",period:6,group:9,valance:0},
  {atomicNumber:78,symbol:"Pt",mass:195.084,name:"Platinum",period:6,group:10,valance:0},
  {atomicNumber:79,symbol:"Au",mass:196.967,name:"Gold",period:6,group:11,valance:0},
  {atomicNumber:80,symbol:"Hg",mass:200.59,name:"Mercury",period:6,group:12,valance:0},
  {atomicNumber:81,symbol:"Tl",mass:204.383,name:"Thallium",period:6,group:13,valance:3},
  {atomicNumber:82,symbol:"Pb",mass:207.2,name:"Lead",period:6,group:14,valance:4},
  {atomicNumber:83,symbol:"Bi",mass:208.98,name:"Bismuth",period:6,group:15,valance:5},
  {atomicNumber:84,symbol:"Po",mass:210,name:"Polonium",period:6,group:16,valance:6},
  {atomicNumber:85,symbol:"At",mass:210,name:"Astatine",period:6,group:17,valance:7},
  {atomicNumber:86,symbol:"Rn",mass:222,name:"Radon",period:6,group:18,valance:8},
  {atomicNumber:87,symbol:"Fr",mass:223,name:"Francium",period:7,group:1,valance:1},
  {atomicNumber:88,symbol:"Ra",mass:226,name:"Radium",period:7,group:2,valance:2},
  {atomicNumber:89,symbol:"Ac",mass:227,name:"Actinium",period:7,group:3,valance:0},
  {atomicNumber:90,symbol:"Th",mass:232.038,name:"Thorium",period:7,group:0,valance:0},
  {atomicNumber:91,symbol:"Pa",mass:231.036,name:"Protactinium",period:7,group:0,valance:0},
  {atomicNumber:92,symbol:"U",mass:238.029,name:"Uranium",period:7,group:0,valance:0},
  {atomicNumber:93,symbol:"Np",mass:237,name:"Neptunium",period:7,group:0,valance:0},
  {atomicNumber:94,symbol:"Pu",mass:244,name:"Plutonium",period:7,group:0,valance:0},
  {atomicNumber:95,symbol:"Am",mass:243,name:"Americium",period:7,group:0,valance:0},
  {atomicNumber:96,symbol:"Cm",mass:247,name:"Curium",period:7,group:0,valance:0},
  {atomicNumber:97,symbol:"Bk",mass:247,name:"Berkelium",period:7,group:0,valance:0},
  {atomicNumber:98,symbol:"Cf",mass:251,name:"Californium",period:7,group:0,valance:0},
  {atomicNumber:99,symbol:"Es",mass:252,name:"Einsteinium",period:7,group:0,valance:0},
  {atomicNumber:100,symbol:"Fm",mass:257,name:"Fermium",period:7,group:0,valance:0},
  {atomicNumber:101,symbol:"Md",mass:258,name:"Mendelevium",period:7,group:0,valance:0},
  {atomicNumber:102,symbol:"No",mass:259,name:"Nobelium",period:7,group:0,valance:0},
  {atomicNumber:103,symbol:"Lr",mass:262,name:"Lawrencium",period:7,group:0,valance:0},
  {atomicNumber:104,symbol:"Rf",mass:261,name:"Rutherfordium",period:7,group:4,valance:0},
  {atomicNumber:105,symbol:"Db",mass:262,name:"Dubnium",period:7,group:5,valance:0},
  {atomicNumber:106,symbol:"Sg",mass:266,name:"Seaborgium",period:7,group:6,valance:0},
  {atomicNumber:107,symbol:"Bh",mass:264,name:"Bohrium",period:7,group:7,valance:0},
  {atomicNumber:108,symbol:"Hs",mass:267,name:"Hassium",period:7,group:8,valance:0},
  {atomicNumber:109,symbol:"Mt",mass:268,name:"Meitnerium",period:7,group:9,valance:0},
  {atomicNumber:110,symbol:"Ds",mass:271,name:"Darmstadtium",period:7,group:10,valance:0},
  {atomicNumber:111,symbol:"Rg",mass:272,name:"Roentgenium",period:7,group:11,valance:0},
  {atomicNumber:112,symbol:"Cn",mass:285,name:"Copernicium",period:7,group:12,valance:0},
  {atomicNumber:113,symbol:"Nh",mass:284,name:"Nihonium",period:7,group:13,valance:3},
  {atomicNumber:114,symbol:"Fl",mass:289,name:"Flerovium",period:7,group:14,valance:4},
  {atomicNumber:115,symbol:"Mc",mass:288,name:"Moscovium",period:7,group:15,valance:5},
  {atomicNumber:116,symbol:"Lv",mass:292,name:"Livermorium",period:7,group:16,valance:6},
  {atomicNumber:117,symbol:"Ts",mass:295,name:"Tennessine",period:7,group:17,valance:7},
  {atomicNumber:118,symbol:"Og",mass:294,name:"Oganesson",period:7,group:18,valance:8},
  ]

};


/*******************************
/* Util
/*******************************
Status: WORKING

A set of static utility methods.

TODO:
1. Refactor to be more consistent
   
*******************************/
JSChemify.Util = {
  isAtom: function(o){
      return o && o._chemType && o._chemType === JSChemify.CONSTANTS.CHEM_TYPE_ATOM;
  },
  isBond: function(o){
      return o && o._chemType && o._chemType === JSChemify.CONSTANTS.CHEM_TYPE_BOND;
  },
  getAtomFromPossibleIndex: function(p,a){
    if(JSChemify.Util.isAtom(a)){
        return a;
    }else if(a-0>=0){
        return p.getAtom(a-0);
    }
   //TODO
    throw "Input neither atom nor atom index";
  },
  getElementFromSymbol:function(s){
    if(!JSChemify.Util.$eLookup){
      cache={};
      JSChemify.CONSTANTS.ELEMENTS.map(e=>cache[e.symbol]=e);
      JSChemify.Util.$eLookup=cache;
    }
    var e= JSChemify.Util.$eLookup[s];
    if(!e)throw "Unknown element '" + s +"'";
    return e;
  },
  toMolDouble:function(d){
    return ("     "+(Math.round(d * 10000) / 10000).toFixed(4)).substr(-10);
  },
  distinct:function(d){
      return [...new Set(d)];
  },
  addVector:function(a,b, mul){
      if(typeof mul === "undefined"){
          mul=1;
      }
      for(var i=0;i<a.length;i++){
        a[i]+=mul*b[i];
    }
    return a;
  },
  subtractVector:function(a,b){
    return JSChemify.Util.addVector(a,b,-1);
  },
  normVector:function(a){
       var sumSq=0;
       for(var i=0;i<a.length;i++){
           sumSq+=a[i]*a[i];
       }
       var nMag=1/Math.sqrt(sumSq);
       for(var i=0;i<a.length;i++){
           a[i]=a[i]*nMag;
       }
       return a;
  },
  dotVector:function(a,b){
      var dot=0;
      for(var i=0;i<a.length;i++){
        dot+=a[i]*b[i];
    }
    return dot;
  },
  rejDotVector:function(a,b){
      var rVec= JSChemify.Util
                        .recipricolVector(b);
    return JSChemify.Util.dotVector(a,rVec);                
  },
  recipricolVector:function(a){
      var n=[];
    n[0]=a[1];
    n[1]=-a[0];
    
    return n;
  },
  sqDist:function(a,b){
      var sumSq=0;
      for(var i=0;i<a.length;i++){
        sumSq+=(a[i]-b[i])*(a[i]-b[i]);
    }
    return sumSq;
  },
  magVector:function(a){
     return Math.sqrt(JSChemify.Util.sqMagVector(a));
  },
  sqMagVector:function(a){
      var sumSq=0;
      for(var i=0;i<a.length;i++){
        sumSq+=(a[i])*(a[i]);
    }
    return sumSq;
  },
  matrixTranspose:function(m){
      var t=[];
    for(var i=0;i<m.length;i++){
        var cvec=m[i];
      for(var j=0;j<cvec.length;j++){
          var c=cvec[j];
        if(!t[j])t[j]=[];
           t[j][i]=c;
      }
    }
    return t;
  },
  matrixOperate:function(m1,op){
    if(op.op==="swap"){
        var oldR=op.rows[0];
        var newR=op.rows[1];
      var t=m1[newR];
      m1[newR]=m1[oldR];
      m1[oldR]=t;
    }else if(op.op === "subtract"){
        var headi=op.rows[0];
        var taili=op.rows[1];
      var headr=m1[headi];
      var tailr=m1[taili];
      var mult=op.mult;
      for(var i=0;i<headr.length;i++){
          var sub=headr[i]*mult;
        tailr[i]=tailr[i]-sub;
      }
    }else if(op.op === "multiply"){
        var ri=op.row;
      var mult=op.mult;
      var row=m1[ri];
      for(var i=0;i<row.length;i++){
          row[i]=row[i]*mult;
      }
    }
    return m1;
  },
  matrixIdentity:function(s){
      var mat=[];
    for(var i=0;i<s;i++){
        var row=[];
      for(var j=0;j<s;j++){
                row.push(0);
      }
      row[i]=1;
      mat.push(row);
    }
    return mat;
  },
  matrixInverse:function(m1){
      var dcopy = m1.map(m=>m.map(a=>a));
    var ident= JSChemify.Util.matrixIdentity(m1.length);
    for(var pos=0;pos<m1.length-1;pos++){
      var top = dcopy.map((r,i)=>[i,r[pos]])
      .filter(b=>(b[0]>=pos))
      .reduce((a,b)=>{
        if(Math.abs(a[1])>Math.abs(b[1]))return a;
        return b;
      });
      if(top[0]!==pos){
        var op={"op":"swap", rows:[pos,top[0]]};
        JSChemify.Util.matrixOperate(dcopy,op);
        JSChemify.Util.matrixOperate(ident,op);
      }
      var row = dcopy[pos];
      var lead= row[pos];
      for(var i=pos+1;i<dcopy.length;i++){
        var lead2=dcopy[i][pos];
        if(lead2===0)continue;
        var rat=lead2/lead;
        var op={"op":"subtract", rows:[pos,i], mult:rat};
        JSChemify.Util.matrixOperate(dcopy,op);
        JSChemify.Util.matrixOperate(ident,op);
      }
    }
    //now the other way
    for(var pos=dcopy.length-1;pos>0;pos--){
        var lead = dcopy[pos][pos];
      for(var i=pos-1;i>=0;i--){
          var lead2=dcopy[i][pos];
        if(lead2===0)continue;
        
        var rat=lead2/lead;
        
        var op={"op":"subtract", rows:[pos,i], mult:rat};
        JSChemify.Util.matrixOperate(dcopy,op);
        JSChemify.Util.matrixOperate(ident,op);
      }
    }
    //finally resize
    for(var i=0;i<dcopy.length;i++){
        var rat=1/dcopy[i][i];
        var op={"op":"multiply", row:i, mult:rat};
      JSChemify.Util.matrixOperate(dcopy,op);
      JSChemify.Util.matrixOperate(ident,op);
    }
    return ident;
  },
  matrixMultiply:function(m1,m2T,t){
      var oneVec=false;
      if(!Array.isArray(m2T[0])){
        m2T=[m2T];
     oneVec=true;
    }
    if(t){
        m2T=JSChemify.Util.matrixTranspose(m2T);
    }
    var pro=[];
    
      for(var x=0;x<m1.length;x++){
        var row=m1[x];
      var result=[];
      for(var y=0;y<m2T.length;y++){
          var column=m2T[y];
        var dot=0;
        for(var i=0;i<column.length;i++){
            dot+=row[i]*column[i];
        }
        result.push(dot);
      }
      pro.push(result);
    }
    if(oneVec){
        return pro.map(v=>v[0]);
    }
    return pro;
  },
  getAffineTransformFromLineSegmentToLineSegment:function(s1,s2,inv){
      var opoint=s1[0];
    var npoint=s2[0];
    var ovecDelta=[s1[1][0]-s1[0][0],s1[1][1]-s1[0][1]];
    var nvecDelta=[s2[1][0]-s2[0][0],s2[1][1]-s2[0][1]];
    var xvec=[1,0];
    
    if(inv){
        var  trans=JSChemify.Util.getTransformFromVectorToVector(
        ovecDelta,
        xvec
        );
      var yInv=[[1,0],[0,-1]];
      var  trans2=JSChemify.Util.getTransformFromVectorToVector(
        xvec,
        nvecDelta
        );
      return JSChemify.AffineTransformation()
                 .translate(npoint[0],npoint[1])
                 .multiply(trans2)
                 .multiply(yInv)
                 .multiply(trans)
                 .translate(-opoint[0],-opoint[1]);
    }
    var  trans=JSChemify.Util.getTransformFromVectorToVector(
    ovecDelta,
    nvecDelta
    );
    var affine=JSChemify.AffineTransformation()
                 .translate(npoint[0],npoint[1])
                 .multiply(trans)
                 .translate(-opoint[0],-opoint[1]);
    
    return affine;
  },
  getTransformFromVectorToVector:function(v1,v2){
      var dot=0;
    var rej=0;
    var alt=1;
    //not sure about the generality here
    for(var i=0;i<v1.length;i++){
        var si = (i+1)%v1.length;
        dot+=v1[i]*v2[i];
      rej+=v1[i]*v2[si]*alt;
      alt=alt*-1;
    }
    var mag1=JSChemify.Util.sqMagVector(v1);
    var mag2=JSChemify.Util.sqMagVector(v2);
    var adj=1/mag1;
    dot=dot*adj;
    rej=rej*adj;
    
    //TODO: think about general case
    //only works for 2x2
    return [[dot,-rej],[rej,dot]];
  }
};

/*******************************
/* AffineTransformation
/*******************************
Status: WORKING

Basic affine transformation type
to help translate, rotate and 
scale.
   
*******************************/
JSChemify.AffineTransformation = function(af){
    if(af && af._matrix)return af;
    var ret={};
  ret._matrix=JSChemify.Util.matrixIdentity(3);
  ret.$inverse=null;
  
  ret.getMatrix=function(){
      return ret._matrix;
  };
  
  ret.setMatrix=function(m){
       if(m._matrix)m=m._matrix;
    
      ret._matrix=m;
    return ret;
  };
  //mutates
  ret.multiply=function(mm,pre){
      if(mm._matrix){
        mm=mm.getMatrix();
    }else{
        if(mm.length==2){
       var nmat=mm.map(c=>{
           var nvec=c.map(cc=>cc);
        nvec.push(0);
        return nvec;
       });
       nmat.push([0,0,1]);
       mm=nmat;
      }
    }
    var mat1=mm;
    var mat2=ret.getMatrix();
    if(pre){
        mat1=mat2;
      mat2=mm;
    }
    var nmat=JSChemify.Util
                       .matrixMultiply(mat2,mat1,true);
    ret._matrix=nmat; 
    return ret;
  };
  ret.preMultiply=function(mm){
      return ret.multiply(mm,true);
  };
  ret.translate=function(x,y,pre){
      var nmat=[[1,0,x],[0,1,y],[0,0,1]];
    return ret.multiply(nmat,pre);
  };
  ret.preTranslate=function(x,y){
      return ret.translate(x,y,true);
  };
  ret.scale=function(sx,sy){
      if(!sy)sy=sx;
      var mat=ret.getMatrix();
    for(var i=0;i<mat.length-1;i++){
        for(var j=0;j<mat.length-1;j++){
          if(i===0)mat[i][j]*=sx;
        if(i===1)mat[i][j]*=sy;
      }
    }
    return ret.setMatrix(mat);
  };
  ret.rotate=function(theta,pre){
      var mat=[[ Math.cos(theta),Math.sin(theta)],
                         [-Math.sin(theta),Math.cos(theta)]];
    return ret.multiply(mat,pre);
  };
  ret.preRotate=function(theta){
    return ret.rotate(theta,true);
  };
  ret.transform=function(vec,o){
    if(o){
        if(!Array.isArray(vec)){
                vec=[vec,o];
      }
    }
    //now need to see what vec is
    //is it a point or a series of
    //points
    if(Array.isArray(vec[0])){
        return vec.map(v=>ret.transform(v));
    }
    //up the space
    vec=[vec[0],vec[1],1];
    var nv= JSChemify.Util
                    .matrixMultiply(ret.getMatrix(),
                    vec);
    nv.pop();
    return nv;
  };
  ret.inverse=function(){
    var mnew=JSChemify.Util.matrixInverse(ret.getMatrix());
    //mnew=JSChemify.Util.matrixTranspose(mnew);
    ret.setMatrix(mnew);
    return ret;
  };
  ret.clone=function(){
      return JSChemify.AffineTransformation(ret.getMatrix());
  };
  
  if(af){
      return ret.setMatrix(af);
  };
  
  return ret;
};


/*******************************
/* Element
/*******************************
Status: WORKING

An object/builder for a chemical 
Element.

TODO:
1. Use this for something?
   
*******************************/
JSChemify.Element = function(def){
  var ret={};
  ret._def=def;
  return ret;
};

/*******************************
/* Atom
/*******************************
Status: WORKING

An object/builder for a chemical atom.
   
*******************************/
JSChemify.Atom = function(){
  var ret={};
  ret._chemType = JSChemify.CONSTANTS.CHEM_TYPE_ATOM;
  
  //will be parent chemical
  ret._parent=null;
  ret._symbol=null;
  ret._charge=0;
  ret._isotope=0;
  ret._radical=0;
  ret._map=null;
  ret._x=0;
  ret._y=0;
  ret._z=0;
  ret._parity=0; //for these purposes, 
                 //1 means that the constituents, travelling
                 //in entered bond sequence, if CCW, for the first
                 //3, would receive a wedge bond to the second
                 //constituent
  
  
  ret.$indexInParent=null;
  ret.$dirty=null;
  ret.$connectedNetworks=null;
  
  
  ret.clone=function(){
    var nat=JSChemify.Atom();
    nat._symbol=ret._symbol;
    nat._charge=ret._charge;
    nat._isotope=ret._isotope;
    nat._radical=ret._radical;
    nat._map=ret._map;
    
    nat._x=ret._x;
    nat._y=ret._y;
    nat._z=ret._z;
    nat._parity=ret._parity;
    return nat;
  };
  
  ret.setSymbol=function(s){
    ret._symbol=s;
    return ret;
  },
  ret.setMap=function(m){
      ret._map=m;
      return ret;
  };
  ret.getMap=function(){
    return ret._map; 
  };
  ret.getCharge=function(){
      return ret._charge;
  };
  ret.setParity=function(s){
    ret._parity=s;
    return ret;
  };
  ret.swapParity=function(){
      if(ret._parity>0){
          ret._parity=ret._parity%2+1;
      }
    return ret;
  };
  ret.getParity=function(){
    return ret._parity;
  };
  ret.setAtomMap=function(a){
    ret._map=a;
    return ret;
  };
  ret.getAtomMap=function(){
    return ret._map;
  };
  ret.getGraphInvariantMarker=function(){
      return ret.getParent().getGraphInvariant()[ret.getIndexInParent()];
  };

  ret.setParityFromStereoBond=function(){
    //TODO: figure this out. I thnk 
    var neighbors =ret.getNeighborAtomsAndBonds();
    if(neighbors.length>=3){
         
        var pn=neighbors[0].atom;
        var nn=neighbors[1].atom;
        var ln=neighbors[2].atom;
        var chainDir = pn.getVectorTo(nn);
        var orthoDir = pn.getVectorTo(ln);
        var rej=chainDir[0]*orthoDir[1]-chainDir[1]*orthoDir[0];
    }
    
  };
  
  ret.setStereoBondFromParity=function(){
      var par=ret.getParity();
      if(par===1||par===2){
        var neighbors =ret.getNeighborAtomsAndBonds();
        var pn=neighbors[0].atom;
        var nn=neighbors[1].atom;
        var ln=neighbors[2].atom;
        var chainDir = pn.getVectorTo(nn);
        var orthoDir = pn.getVectorTo(ln);
        var rej=chainDir[0]*orthoDir[1]-chainDir[1]*orthoDir[0];
        var order=neighbors
                    .filter(a=>a.bond.getBondStereo()===0)
                    .sort((a,b)=>
                      a.atom.getGraphInvariantMarker() - 
                      b.atom.getGraphInvariantMarker());
        if(order.length>0){
            useBond=order[0];
        } else{
            throw "Can't assign stereo bonds, no bonds available";
        }                               
                                            
        if(useBond.bond._atom2===ret){
              useBond.bond.swap();
        }
        rej=rej*(par-1.5);
        if(rej>0){
            useBond.bond.setBondStereo(JSChemify.CONSTANTS.BOND_STEREO_WEDGE);
        }else{
            useBond.bond.setBondStereo(JSChemify.CONSTANTS.BOND_STEREO_DASH);
        }
      };
      return ret;
  };
  ret.getIsotope=function(){
      return ret._isotope;
  };
  ret.getElement=function(){
   return JSChemify.Util.getElementFromSymbol(ret._symbol);
  };
  ret.setParent=function(p){
      //TODO check parent is right type
      ret._parent=p;
    return ret;
  };
  
  ret.getParent=function(){
      return ret._parent;
  };
  
 
  ret.getIndexInParent=function(){
      if(ret.$indexInParent===null || 
       ret.getParent().$dirtyNumber()!=ret.$dirty){
      ret.$dirty=ret.getParent().$dirtyNumber();
        ret.$indexInParent=ret.getParent().getIndexOf(ret);
    }
      return ret.$indexInParent;
  };
  
  ret.getNeighborAtomsAndBonds=function(order){
      if(order){
         var ss=ret.getBonds()
            .map(b=>({"bond":b,"atom":b.getOtherAtom(ret)}))
            .sort(order);
         return ss;
      }
      return ret.getBonds()
                .map(b=>({"bond":b,"atom":b.getOtherAtom(ret)}));
  };
  ret.getCenterPointOfNeighbors=function(){
    var sumV=ret.getNeighborAtomsAndBonds()
       .map(a=>a.atom)
       .map(a=>[a.getX(),a.getY(),1])
       .reduce(JSChemify.Util.addVector);
    sumV[0]=sumV[0]/sumV[2];
    sumV[1]=sumV[1]/sumV[2];
    sumV.pop();
    return sumV;
  };
  ret.getVectorAwayFromNeighborCenters=function(){
    var cent=ret.getCenterPointOfNeighbors();
    var vecTo=ret.getVectorToPoint(cent);
    //if the vector is 0,0, instead
    //point to the least occupied location
    if(vecTo[0]===0 && vecTo[1]===0){
      return ret.getLeastOccupiedVector();
    }
    return JSChemify.Util.normVector(vecTo);
  };
  
  ret.setCharge=function(c){
    ret._charge=c;
    return ret;
  };
  ret.getPoint=function(){
      return [ret.getX(),ret.getY()];
  };
  ret.getX=function(){
      return ret._x;
  };
  ret.getY=function(){
      return ret._y;
  };
  ret.getZ=function(){
      return ret._x;
  };
  ret.setXYZ=function(x,y,z){
    if(x+""==="NaN"){
      throw "WAT";
    }
    ret._x=x;
    ret._y=y;
    if(z){
        ret._z=z;
    }
    return ret;
  };
  ret.setIsotope=function(iso){
    ret._isotope=iso;
    return ret;
  };
  
  ret.getSymbol=function(){
      return ret._symbol;
  };
  
  ret.getBonds=function(){
      return ret.getParent().getBondsTo(ret);
  };
  ret.hasNeighbor=function(pred){
      return ret.getNeighborAtomsAndBonds()
              .findIndex(aa=>pred(aa.atom,aa.bond))>=0;
  };
  
  ret.isNNitrosamineEnd=function(){
      return (ret.getSymbol()==="N") &&
                 (ret.hasBondStrs(["=O","-N"])) ;
  };
  ret.isNNitrosamine=function(){
      return (ret.getSymbol()==="N") && ret.getNeighborAtomsAndBonds().findIndex(na=>na.atom.isNNitrosamineEnd())>=0;
  };
  ret.isAlphaNNitrosamine=function(){
      return (ret.getSymbol()==="C") && ret.getNeighborAtomsAndBonds().findIndex(na=>na.atom.isNNitrosamine())>=0;
  };
  ret.getBondStrs=function(){
      return ret.getNeighborAtomsAndBonds().map(f=>f.bond.toSmiles(true)+f.atom.getSymbol());
  };
  ret.hasBondStrs=function(ip){
      if(!Array.isArray(ip))ip=[ip];
    return ret.getBondStrs().findIndex(bs=>ip.indexOf(bs)<0)===-1;
  };
  
  ret.getBondCount=function(){
      return ret.getBonds().length;
  };
  
  
  ret.getAtomsCloserThan=function(dist){
    var sqDist=dist*dist;
    return ret.getParent().getAtoms()
                                 .filter(a=>a!==ret)
                   .map(a=>[a,ret.getVectorTo(a)])
                   .map(a=>{
                               a[1]=JSChemify.Util.sqMagVector(a[1]);
                        return a;
                   })
                   .filter(a=>a[1]<sqDist)
                   .map(a=>a[0]);
  };
  
  ret.getVectorTo=function(at2){
      return [at2.getX()-ret.getX(),at2.getY()-ret.getY()];
  };
  
  ret.getVectorToPoint=function(pt2){
      return [pt2[0]-ret.getX(),pt2[1]-ret.getY()];
  };
  
  ret.isTerminal=function(){
          var bnds=ret.getBonds();
      return bnds.length==1;
  };
  
  ret.getValance=function(){
      return ret.getElement().valance - (ret.getCharge());
  };
  ret.getElectronsInExplicitBonds=function(){
      if(ret.getBondCount()==0){
          return 0;
      }
      var te=ret.getBonds().map(b=>b.getBondOrder()).map(bo=>(bo==4)?3:bo*2).reduce((a,b)=>a+b)/2;
      return te;
  };
  ret.getLonePairs=function(){
      return Math.max(0,ret.getValance()-4);
  };
  
  ret.getDeltaV=function(){
      var val=ret.getValance();
      var hT=ret.getTotalHydrogenCount();
      return val-hT;
  };
  ret.getDelta=function(){
      return ret.getBondCount()-ret.getExplicitHydrogens();
  };
  ret.getIntrinsicState=function(){
      var val=ret.getValance();
      var hI=ret.getImplicitHydrogens();
      var hE=ret.getExplicitHydrogens();
      var hT=hI+hE;
      var n=ret.getElement().period;
      var sigma = ret.getBondCount()-hE;
      var fac = (2/n)*(2/n);
    
      return (fac*(val-hT)+1)/(sigma);    
  };
   
  ret.getEState=function(MAX_DEPTH){
    if(!MAX_DEPTH)MAX_DEPTH=15;
    var e0=ret.getIntrinsicState();
    var eSum=e0;
    for(var i=1;i<MAX_DEPTH;i++){
        var sqDist=1.0/((i+1)*(i+1));
        eSum+=ret.getAtomsAtDistance(i).map(at=>((e0-at.getIntrinsicState()))).reduce((a,b)=>a+b,0)*sqDist;
    }
    return eSum;
  };
  
  ret.getKierHallAtomType2=function(){
  var prefix="E" + ret.getNeighborAtomsAndBonds().filter(ba=>ba.atom.getSymbol()!=="H")
                    .map(ba=>ba.bond.getBondOrder())
                    .sort()
                    .map(b=>{
                    if(b===1)return "s";
                    if(b===2)return "d";
                    if(b===3)return "t";
                    if(b===4)return "a";
                    }).join("");
     var hcount=ret.getTotalHydrogenCount();      
     if(hcount>0){
         return prefix + ret.getElement().group + "H"+hcount;
     }else{
      return prefix + ret.getElement().group;
     }
  };
  ret.getKierHallAtomType=function(){
      var prefix=ret.getNeighborAtomsAndBonds().filter(ba=>ba.atom.getSymbol()!=="H")
                    .map(ba=>ba.bond.getBondOrder())
                    .sort()
                    .map(b=>{
                    if(b===1)return "s";
                    if(b===2)return "d";
                    if(b===3)return "t";
                    if(b===4)return "a";
                    }).join("");
     var hcount=ret.getTotalHydrogenCount();      
     if(hcount>0){
         return prefix + ret.getSymbol() + "H"+hcount;
     }else{
      return prefix + ret.getSymbol();
     }
  };
  ret.getTotalHydrogenCount=function(){
  return ret.getImplicitHydrogens()+ ret.getExplicitHydrogens();
  };
  ret.getExplicitHydrogens=function(){
      return ret.getNeighborAtomsAndBonds().filter(bb=>bb.atom.getSymbol()==="H").length;
  };
  ret.getImplicitHydrogens=function(){
        var expectedBonds=ret.getValance()-(ret.getLonePairs()*2);
        var explicit=ret.getElectronsInExplicitBonds();
        return Math.max(0,expectedBonds-explicit);
  };
  ret.getAtomsAtDistance=function(d){
      return ret.getParent().getNeighborAtomsAtDistance(ret,d);
  };
  ret.getShortestAtomDistance=function(a){
      return ret.getParent().getShortestAtomDistance(ret,a);
  };

  ret.getBondsCCW=function(filt){
  if(!filt)filt=(a)=>true;
  return ret.getNeighborAtomsAndBonds()
     .filter(b=>filt(b))
     .map(n=>{
       let vec=ret.getVectorTo(n.atom);
       let theta = Math.atan2(vec[1],vec[0]);
       n["ang"]=theta;
       return n;
     })
    .sort((a,b)=>{
    return a.ang-b.ang;
    });
  };
  
  //returns the delta vector
  ret.getLeastOccupiedVector=function(filt){
      var bonds=ret.getBondsCCW(filt);
      var maxAng=-1000;
      var bAng=null;
      if(bonds.length===0){
          return [1,0];
      }
      if(bonds.length===1){
        let ang=bonds[0].ang+Math.PI;
        
        return [Math.cos(ang),Math.sin(ang)];
      }
      for(let i=0;i<bonds.length;i++){
          let p=(i)%bonds.length;
          let n=(i+1)%bonds.length;
          let thetaDiff=bonds[n].ang-bonds[p].ang;
          let inv=false;
          if(i+1>=bonds.length){
            thetaDiff=thetaDiff+Math.PI*2;
            inv=true;
          }
          if(thetaDiff>maxAng){
            maxAng=thetaDiff;
            thetaAvg=(bonds[n].ang+bonds[p].ang)/2;
            if(inv){
              thetaAvg=thetaAvg+Math.PI;
            }
            bAng=thetaAvg;
          }
      }
      return [Math.cos(bAng),Math.sin(bAng)];
    
  };
  
  ret.getLeastOccupiedCardinalDirection=function(){
      var up=[0,1];
      var right=[1,0];
      var gvec=ret.getLeastOccupiedVector();
      var dot1=gvec[0]*up[0]+gvec[1]*up[1];
      var dot2=gvec[0]*right[0]+gvec[1]*right[1];
      if(ret.getBonds().length>1 && Math.abs(dot1)>Math.abs(dot2)){
          if(dot1<=0)return up;
          return [-up[0],-up[1]];
      }else{
          if(dot2<=-4E-2){
            return right;
          }
          return [-right[0],-right[1]];
      }
  };
  
  ret.getConnectedNetworkAndBonds=function(){
      //TODO: this is really expensive and 
      //can be simplified with better caching
      //still thinking about how to do that
          if(ret.$connectedNetworks===null || 
       ret.getParent().$dirtyNumber()!=ret.$dirty){
      ret.$dirty=ret.getParent().$dirtyNumber();
      var tmp={};
      ret.$allPathsDepthFirst((p)=>{
          if(p.length<2)return;
          var head =p[p.length-1];
          var root =p[1];
        //don't get root ring bonds as network
        if(root.bond.isInRing())return true;
        var rootBondIndex=root.bond.getIndexInParent();
        var onet=tmp[rootBondIndex];
        if(!onet){
            onet={};
            tmp[root.bond.getIndexInParent()]=onet;
        }
        //add atom as foliage
        onet[head.atom.getIndexInParent()]=true;
      });
      ret.$connectedNetworks=Object.keys(tmp).map(k=>{
          var rbond = ret.getParent().getBond(k);
        //var atoms = Object.keys(tmp[k]).map(ai=>ret.getParent().getAtom(ai));
        var atoms = tmp[k];
        return {"bond":rbond,"network":atoms};
      });
    }
      return ret.$connectedNetworks;
  };
  ret.areAtomsSplit=function(atoms){
  //TODO: fix this
      //ret.getConnectedNetworkAndBonds()
            //.
  };
  
  //will call cb for each subPart
  ret.$allPathsDepthFirst=function(cb,sofar,verbose,order, forcePop){
     
    if(!sofar){
        sofar=[{"atom":ret,"bond":null}];
    }
    var nbonds = ret.getNeighborAtomsAndBonds(order);
    var okBonds = nbonds.filter(checkBond=>sofar.findIndex(sf=>sf.bond===checkBond.bond)<0);
    for(var i=0;i<okBonds.length;i++){
        var checkBond = okBonds[i];
      //not part of the path
            var type;
      if(okBonds.length===1){
          type= "CHAIN";
      }else{
          type=(i===okBonds.length-1)?"CHAIN_BRANCH":"BRANCH";
      }
     
      sofar.push(checkBond);
      //STOP if return true
      var eva=!cb(sofar,type);
      if(eva){
        checkBond.atom.$allPathsDepthFirst(cb,sofar,verbose,order,forcePop);
      }
      sofar.pop();
      if(verbose && type==="BRANCH"
         && (eva ||forcePop)
        ){
          cb(sofar,"POP");
      }
    }
      return ret;
  };
  
  ret.isInRing=function(){
      if(ret.getBondCount()<2)return false;
      return (ret.getBonds().findIndex(b=>b.isInRing())>=0)
  };
  
  ret.getMass=function(){
      return ret.getElement().mass;
  };
  ret.isAromatic=function(){
      return ret.getBonds().findIndex(b=>b.getBondOrder()===4)>=0;
  };
  
  //TODO: Move out probably
  ret.toMolLine=function(){
        var chg="0";
        var map=ret.getAtomMap();
        if(!map){
          map=0;
        }
        if(ret.getCharge()!==0 && 
           Math.abs(ret.getCharge())<=4)chg=4-ret.getCharge();
              return JSChemify.Util.toMolDouble(ret._x)+
        JSChemify.Util.toMolDouble(ret._y)+
        JSChemify.Util.toMolDouble(ret._z)+" "+
        (ret.getSymbol()+"  ").substr(0,3)+ 
        " 0  " + chg+ "  0  0  0  0  0  0  0"+
          ("   "+map).substr(-3) +
          "  0  0";
        //   27.5477   -5.8710    0.0000 O   0  7  0  0  0  0  0  0  0  0  0  0
    //
  };
  ret.fromMolLine=function(line){
//   -3.8971    2.2500    0.0000 C   0  0  0  0  0  0  0  0  0  7  0  0
    var x= line.substr(0,10).trim()-0;
    var y= line.substr(10,10).trim()-0;
    var z= line.substr(20,10).trim()-0;
    var symbol= line.substr(31,3).trim();
    var charge= line.substr(37,3).trim();
    
    var map= line.substr(61,3).trim();
    if(map && map!=="0"){
        ret.setAtomMap(map);
    }

     //TODO: read parity, isotope, radical
    
    
    if(charge && charge!=="0"){
        ret.setCharge(-(charge-4));
    }
    return ret.setXYZ(x,y,z).setSymbol(symbol);
  };
  
  
  ret.toSmiles=function(){
    var eH=ret.getImplicitHydrogens();
    var ehShow = (eH>1)?eH:"";
    var simpleOkay =ret.getElement().smiles;
    if(simpleOkay && !ret._isotope && !ret._charge && !ret._map){
        if(ret.isAromatic()){
          return ret.getSymbol().toLowerCase();
      }
      return ret.getSymbol();
    }
    var chargeStr=ret._charge+"";
    if(ret._charge>0){
        chargeStr="+" + ret._charge;
    }
    
    if(chargeStr==="-1")chargeStr="-";
    if(chargeStr==="+1")chargeStr="+";
    if(chargeStr=== "0")chargeStr="";
     
    
    var rr= "["
      +((ret._isotope)?(ret._isotope):("")) +
      ret._symbol +
      ((eH)?("H"+ehShow):"") +
      ((chargeStr)?chargeStr:"") +
      ((ret._map)?(":"+ret._map):"") +
      "]";
    return rr;
  };
  
  
  return ret;

};


/*******************************
/* Bond
/*******************************
Status: WORKING

An object/builder for a chemical bond.
   
*******************************/
JSChemify.Bond = function(){
  var ret={};
  ret._chemType = JSChemify.CONSTANTS.CHEM_TYPE_BOND;
  //will be parent chemical
  ret._parent=null;
  ret._order=1;
  ret._stereo=JSChemify.CONSTANTS.BOND_STEREO_NONE;
  ret._atom1=null;
  ret._atom2=null;
  
  
  ret.$smallestRingSize=null;
  ret.$indexInParent=null;
  ret.$dirty=-1;
  
  ret.clone=function(){
      var bnd=JSChemify.Bond();
    bnd._order=ret._order;
    bnd._stereo=ret._stereo;
    bnd._atom1=ret._stereo;
    bnd._atom2=ret._stereo;
    return bnd;
  };
  ret.setParent=function(p){
    ret._parent=p;
    return ret;
  };
  ret.getSharedAtom=function(b){
    if(b.hasAtom(ret._atom1)){
  return ret._atom1;
    }else if(b.hasAtom(ret._atom2)){
  return ret._atom2;
    }
    return null;
  };
  ret.hasAtom=function(a){
     return ret.getAtoms().indexOf(a)>=0;
  };
  ret.setCoordinatesFromPathNotation=function(path,ovec,a){
      var nvec=JSChemify.PathNotation().deltaVectorFromPath(path);
      
      var nat=ret.getOtherAtom(a);
      var oldpt=a.getPoint();
      var pvec=[-ovec[1],ovec[0]];
      var wedge=path[2];
      if(wedge){
        var wlow=wedge.toLowerCase();
        var par=1;
        //TODO: something is wrong about this logic, but I don't
        //know what
        if(wedge===wedge.toLowerCase()){
          //par=par*-1;
        }
        if(ret._atom2!==a){
          //par=par*-1;
        }
        if(par<0){
          ret.swap();
        }
        
        if(wlow==="h"){
          ret.setBondStereo(JSChemify.CONSTANTS.BOND_STEREO_DASH);
        }else  if(wlow==="w"){
          ret.setBondStereo(JSChemify.CONSTANTS.BOND_STEREO_WEDGE);
        }
      }
        
      var nnvec=[ovec[0]*nvec[0]+pvec[0]*nvec[1],ovec[1]*nvec[0]+pvec[1]*nvec[1]];
      nat.setXYZ(oldpt[0]+nnvec[0],oldpt[1]+nnvec[1]);
      return ret;
  };
  ret.pathNotationDirectionFrom=function(dx,dy,a){
     let vec1=[dx,dy];
    //----
     let vec2=a.getVectorTo(ret.getOtherAtom(a));
     let bs=ret.getBondStereo();
     let wedge="";
     if(bs){
        if(bs===JSChemify.CONSTANTS.BOND_STEREO_WEDGE){
          wedge="W";
        }else if(bs===JSChemify.CONSTANTS.BOND_STEREO_DASH){
          wedge="H";
        }
        if(ret._atom1!==a){
          //TODO: come back to this
    //wedge=wedge.toLowerCase();
        }
     }
     var pn= JSChemify.PathNotation().pathFromDeltaVector(vec1,vec2);
     if(wedge){
        pn.push(wedge);
     }
     return pn;
  };
  ret.pathNotationDirectionTo=function(b,a){
     if(!a){
         a=ret.getSharedAtom(b);
     }
     let vec1=ret.getOtherAtom(a).getVectorTo(a);
     let vec2=a.getVectorTo(b.getOtherAtom(a));
     let bs=b.getBondStereo();
     let wedge="";
     if(bs){
        if(bs===JSChemify.CONSTANTS.BOND_STEREO_WEDGE){
          wedge="W";
        }else if(bs===JSChemify.CONSTANTS.BOND_STEREO_DASH){
          wedge="H";
        }
        if(ret._atom2!==a){
          //TODO: come back to this
          //wedge=wedge.toLowerCase();
        }
     }
     var pn= JSChemify.PathNotation().pathFromDeltaVector(vec1,vec2);
     if(wedge){
        pn.push(wedge);
     }
     return pn;
  };
  
  ret.swap=function(){
      var t=ret._atom1;
      ret._atom1=ret._atom2;
      ret._atom2=t;
  };
  
  ret.getSmallestRingSize=function(){
      if(ret.$smallestRingSize==null || 
       ret.getParent().$dirtyNumber()!==ret.$dirty){
      var rings=ret.getParent().getRings();
      ret.$smallestRingSize=rings.filter(r=>r.hasBond(ret))
       .map(r=>r.getSize())
       .reduce((a,b)=>{
          if(a<b)return a;
            return b;
          },1000);
      if(ret.$smallestRingSize===1000){
          ret.$smallestRingSize=-1;//maybe infinity instead?
      }
      ret.$dirty=ret.getParent().$dirtyNumber();
    }
    return ret.$smallestRingSize;
  };
  ret.getSmallestRings=function(){
    var rsize=ret.getSmallestRingSize();
    return ret.getParent().getRings()
       .filter(r=>r.hasBond(ret))
       .filter(r=>r.getSize()===rsize);
  };
  
  ret.getParent=function(){
      return ret._parent;
  };
  
  ret.getCenterPoint=function(){
    var cpt=ret.getAtoms()
               .map(at=>[at.getX(),at.getY(),1])
               .reduce(JSChemify.Util.addVector);
    cpt[0]=cpt[0]/cpt[2];
    cpt[1]=cpt[1]/cpt[2];
    cpt.pop();
    return cpt;
  };
  
  ret.getIndexInParent=function(){
      if(ret.$indexInParent===null || 
       ret.getParent().$dirtyNumber()!=ret.$dirty){
      ret.$dirty=ret.getParent().$dirtyNumber();
        ret.$indexInParent=ret.getParent().getIndexOf(ret);
    }
      return ret.$indexInParent;
  };
  
  /**
      Checks if both atoms have a double bond
  **/
  ret.couldBeAromatic=function(){
      return (ret.getAtoms()
      .filter(a=>a.getBonds()
              .filter(b=>b.getBondOrder()===2)
              .length===1)
      .length===2);
  };
  
  ret.setAtoms=function(a1,a2){
         ret._atom1= JSChemify.Util.getAtomFromPossibleIndex(ret._parent,a1);
    ret._atom2= JSChemify.Util.getAtomFromPossibleIndex(ret._parent,a2);
    return ret;
  };
  ret.setBondOrder=function(o){
          ret._order=o;
      return ret;
  };
  ret.getBondOrder=function(){
      return ret._order;
  };
  ret.getAtom1=function(){
      return ret._atom1;
  };
  ret.getAtom2=function(){
      return ret._atom2;
  };
  ret.setBondStereo=function(st){
      ret._stereo=st;
    return ret;
  };
  
  ret.getBondStereo=function(st){
    return ret._stereo;
  };
  ret.getDeltaVector=function(){
      return ret._atom2.getVectorTo(ret._atom1);
  };
  ret.getLineSegment=function(){
      return ret.getAtoms().map(at=>[at.getX(),at.getY()]);
  };
  ret.setBond=function(a1,a2,bondOrder,bondStereo){
      return ret.setAtoms(a1,a2)
                    .setBondOrder((bondOrder!=null)?bondOrder:1)
                    .setBondStereo((bondStereo!=null)?bondStereo:0);
        
  };
  ret.containsAtom=function(at){
      if(ret._atom1===at || ret._atom2 === at)return true;
    return false;
  };
  ret.getOtherAtom=function(at){
      if(ret._atom1===at & ret._atom2!==at)return ret._atom2;
      if(ret._atom2===at & ret._atom1!==at)return ret._atom1;
    return null;
  };
  ret.getAtoms=function(){
      return [ret._atom1,ret._atom2];
  };
  
  ret.getNeighborAtomsAndBonds=function(){
      return ret.getAtoms()
               .flatMap(a=>a.getBonds().map(b=>({"bond":b,"atom":a})))
               .filter(ba=>ba.bond!==ret);
  };
  ret.isTerminal=function(){
      return ret.getAtoms().filter(at=>at.isTerminal()).length>0; 
  };
  ret.isInRing=function(){
      return ret.getParent().isRingBond(ret);
  };
  
  //TODO: Move out probably
  ret.toMolLine=function(){
      return ret.getAtoms().map(at=>at.getIndexInParent()+1)
        .map(ai=>("  "+ai).substr(-3)).join("")
        +("  "+ ret._order).substr(-3)
        +("  "+ ret._stereo).substr(-3);
  };
  
  ret.fromMolLine=function(line){
    var aindex1= line.substr(0,3).trim()-1;
    var aindex2= line.substr(3,3).trim()-1;
    var order= line.substr(6,3).trim()-0;
    var stereo= line.substr(9,3).trim()-0;
    return ret.setBond(aindex1,aindex2,order,stereo);
  };
  
  ret.toSmiles=function(force){
    //TODO: Deal with stereo
    if(ret._order==1){
        if(force)return "-";
        return "";
    }else if(ret._order==2){
        return "=";
    }else if(ret._order==3){
        return "#";
    }else if(ret._order==4){
        return ":";
    }
    return "~";
  };
  

    return ret;
};

/*******************************
/* Chemical
/*******************************
Status: WORKING

An object/builder for chemicals.

TODO:
1. Refactor to use consistent conventions
   for $, $$ and _ meaning.
2. Improve how clone and cache works.
   
*******************************/
JSChemify.Chemical = function(arg){
  if(arg && arg._chemType===JSChemify.CONSTANTS.CHEM_TYPE_CHEMICAL){
      return arg;
  }
  var ret={};
  ret._chemType = JSChemify.CONSTANTS.CHEM_TYPE_CHEMICAL;
  ret._atoms=[];
  ret._bonds=[];
  ret._sgroups=[];
  ret._name=null;
  ret.$bondTypes=null;
  ret.$atomComponentTypes=null;
  ret.$componentCount=null;
  ret._rings=null;
  ret.$atomDistances=null;
  ret._properties={};
  
  
  ret.$ringSystems=null;
  ret.$EstateVector=null;
  ret.$graphInvariant;
  ret.$$dirty=0;
  
  ret.removeProperty=function(k){
      delete ret._properties[k];
      return ret;
  };
  ret.setProperty=function(k,v){
      ret._properties[k]=v;
      return ret;
  };
  ret.getProperty=function(k){
      return ret._properties[k];
  };
  ret.getProperties=function(keys){
      return keys.map(k=>ret.getProperty(k)).map(v=>(v)?v:"");
  };
  ret.getPropertyKeys=function(){
      return Object.keys(ret._properties);
  };
  
  ret.getPropertiesSD=function(keys){
    if(!keys){
        keys=ret.getPropertyKeys().sort();
    }
    if(!keys)return "";
    return keys.map(k=>"> <" + k + ">\n" +ret.getProperty(k) + "\n").join("\n");
    
  };
  ret.$ringSystemCoordinates=function(ringSystem,satom,delta){
      
    var atomSet=[];
    var firstRing = null;
    if(satom){
        firstRing=ringSystem.getRings()
                          .filter(rr=>rr.hasAtom(satom))
                .sort((a,b)=>{
                    if(a.getSize()===6){
                      return -1;
                  }else if(b.getSize()===6){
                      return 1;
                  }
                    //get smallest .. I think
                    return a.getSize()-b.getSize();
                })[0];
    }else{
        firstRing=ringSystem.getRings()
                .sort((a,b)=>{
                    if(a.getSize()===6){
                      return -1;
                  }else if(b.getSize()===6){
                      return 1;
                  }
                    //get smallest .. I think
                    return a.getSize()-b.getSize();
                })[0];
    };
    
    ret.$ringCoordinates(firstRing,satom,null, delta);
    firstRing.getAtoms().map(aa=>atomSet.push(aa));
    var stack = firstRing.getNeighborRingsAndBonds().map(nn=>nn);
    
    while(stack.length>0){
      var nRingConnection = stack.pop();
      var newRing = nRingConnection.ring;
      //If the new ring has unassiged atoms, process it.
      //otherwise continue down the stack
      if(newRing.getAtoms().findIndex(aa=>atomSet.indexOf(aa)<0)>=0){
        var oldRing = nRingConnection.bond.getOtherRing(newRing);
        var bridgeHeads = nRingConnection.bond.getBridgeHeads();
        var delta=null;
        var direction=1;
        var internalDelta=false;
        var centerVec = bridgeHeads[0].getVectorToPoint(oldRing.getCenterPoint());
        centerVec=JSChemify.Util.normVector(centerVec);

        if(bridgeHeads.length===1){ //Spiro
          internalDelta=false;
          delta=[-centerVec[0],-centerVec[1]];
        }else{
          internalDelta=true;
          delta=bridgeHeads[1].getVectorTo(bridgeHeads[0]);
          direction=centerVec[1]*delta[0]-centerVec[0]*delta[1];
        }
         
        ret.$ringCoordinates(newRing,
                                            bridgeHeads[0],
                          bridgeHeads[1],
                          delta,
                          internalDelta,
                          direction);
        newRing.getAtoms()
                     .filter(aa=>atomSet.indexOf(aa)<0)
               .map(aa=>atomSet.push(aa));  
        newRing.getNeighborRingsAndBonds()
                         .filter(nn=>stack.findIndex(on=>on.ring===nn.ring)<0)
                 .map(nn=>stack.push(nn));  
      }
    }
    return ret;
  };
  ret.getLayoutAdjustableAtoms=function(){
      if(!ret.$adjustableAtoms){
        var gInv=ret.getGraphInvariant();
        ret.$adjustableAtoms=ret.getAtoms()
         .filter(at=>!at.isInRing()) //TODO:maybe keep some?
         .filter(at=>at.getBonds().length>=2);
         /*
         .filter(at=>{
            var counts=at.getNeighborAtomsAndBonds()
              .map(n=>gInv[n.atom.getIndexInParent()])
              .map(v=>{
                  var m={};
                m[v]=1;
                return m;
              }).reduce((a,b)=>{
                  Object.keys(b).map(bk=>{
                    if(!a[bk])a[bk]=0;
                    a[bk]=b[bk]+a[bk];
                });""
                return a;
              });
              var uniq = Object.values(counts);
              
            return Object.values(counts).findIndex(c=>c>1)<0;
         });
         */
    }
    return ret.$adjustableAtoms;
  };
  //TODO: Speed up
  ret.clone=function(){
      var nchem = JSChemify.Chemical();
    nchem.setName(ret.getName());
    nchem._properties=
        JSON.parse(JSON.stringify(ret._properties));
    var bds=[];
    ret.getAtoms()
         .map((a,i)=>{
                 var nat=nchem.addAtom(a.clone());
              bds[i]=nat;
         });
    ret.getBonds()
        .map(b=>{
          var at1=bds[b._atom1.getIndexInParent()];
          var at2=bds[b._atom2.getIndexInParent()];

          var nbd=b.clone();
          nbd._atom1=at1;
          nbd._atom2=at2;
          nchem.addBond(nbd);

        });
           
     return nchem;
  };
  
  //TODO:Need a way to orient things here
  ret.$hexRingPath=function(s){
        var start="RLRRRLRRRLRR";
      if(s<12)return start;
      if(s>=12 && s<=16){
        var c=12;
        while(s>c){
          start=start.replace(/RRLRR/,"RLRRRLR");
          c+=2;
        }
      }else{
           var c=18;
          start="LRRLRRLRRLRRLRRLRR";
        while(s>c){
          start=start.replace(/RRLRR/,"RLRRRLR");
          c+=2;
        }
      }
      return start;
  };
    
  ret.$ringCoordinates=function(ring,satom,eatom,delta,internalDelta,direction){
      
    var ratoms = ring.getAtoms();
    var ai=0;
    var acountAng=ratoms.length;
    var acountSet=ratoms.length;
    var rev=false;
    if(!satom){
        satom=ratoms[0];
    }else{
        ai=ratoms.findIndex(at=>at===satom);
    }
    if(eatom){
        var eIndex= ratoms.findIndex(at=>at===eatom);
      //[A,B,C,D,E,F]
      //Imagine start is D, end is E
      var difference1 = ai-eIndex;             //3-4 =-1   1
      var difference2 = difference1+acountAng; //9-4 = 5   7
      if(difference1>0){
          difference2 = difference1-acountAng;  //-3-4=-7  -5
      }
      //find the largest path
      var dist = (Math.abs(difference1)>Math.abs(difference2))?
                                      difference1:difference2;
      if(dist>0){
          rev=true;
      }else{
          rev=false;
      }
      dist=Math.abs(dist);
      acountAng=Math.min(ratoms.length,dist+1);
      acountSet=dist;
    }
    
    var ang=Math.PI*2/acountAng;
    var outsideAng=Math.PI*2-ang;
    
    var adj =[Math.cos(ang), Math.sin(ang)];
    var adjHalf=[Math.cos(outsideAng/2), Math.sin(outsideAng/2)];
    
    var deltaR =[Math.cos(Math.PI/3), 
                              Math.sin(Math.PI/3)];
                  
    var deltaL =[Math.cos(-Math.PI/3), 
                              Math.sin(-Math.PI/3)];
    
    if(direction && direction<0){
        adj[1]=-adj[1];
      adjHalf[1]=-adjHalf[1];
      var t=deltaR;
      deltaR=deltaL;ring
      deltaL=t;
      
    }
    if(acountSet>=11){
        adjHalf=[Math.cos(-Math.PI/6), 
                              Math.sin(-Math.PI/6)];
    }
    if(!delta){
        delta=[0,1];
    }
    var path=ret.$hexRingPath(acountSet);
    
    var lastPoint=[satom.getX(),satom.getY()];
   // satom.setXYZ(lastPoint[0],lastPoint[1]);
    if(!internalDelta){    
      var ndelta=[-delta[1],delta[0]];
      delta=[
        -adjHalf[0]*ndelta[0] - adjHalf[1]*ndelta[1],
         adjHalf[1]*ndelta[0] - adjHalf[0]*ndelta[1]
      ];
    }
    for(var i=1;i<acountSet;i++){
        var ni=(ai+i)%ratoms.length;
      if(rev){
          ni=(ai-i+ratoms.length)%ratoms.length;
      }
      
      if(acountSet>=11){
          if(path[ni]==="R"){
            adj=deltaR;
        }else{
            adj=deltaL;
        }
      }
      delta = [
      delta[0]*adj[0]+ delta[1]*adj[1],
      -delta[0]*adj[1]+ delta[1]*adj[0]
      ];
       
      lastPoint[0]=lastPoint[0]+delta[0];
      lastPoint[1]=lastPoint[1]+delta[1];
        ratoms[ni].setXYZ(lastPoint[0],lastPoint[1]);
    }
    
    return ret;

  };
  ret.$treeCoordinates=function(ai, cursor,delta,test, cb){
      if(!ai)ai=0;
    var BASIS=JSChemify.CONSTANTS.VECTORS_BASIS;
    
    
    var bangles =BASIS.bangles;
    var altBangles=BASIS.altBangles;       
    var altBanglesR=BASIS.altBanglesR;            
    
    var satom= ret.getAtom(ai);
    if(!cursor){
        cursor=[satom.getX(),satom.getY()];
    }else{
        satom.setXYZ(cursor[0],cursor[1]);
    }
    
    if(cb){
        cb(satom);
    }
    
    var emptyOrigin=false;
    //var delta=[Math.cos(Math.PI/6),-Math.sin(Math.PI/6)];
    if(!delta){
      delta=[-BASIS.up[1],BASIS.up[0]];
      emptyOrigin=true;
    }
    
    var stackCursor=[];
    var stackDelta=[];
    var stackParity=[];
    var stackBnums=[];
    var parity=0;
    var bnum=0;
    var gInv=ret.getGraphInvariant();
    
    var justPopped=false;
    satom.$allPathsDepthFirst((p,t)=>{
           var tbond =p[p.length-1];
      
      //skip ring bonds
      if(tbond.bond && tbond.bond.isInRing() || (test && !test(tbond)))return true;
        if(t==="POP"){
          cursor=stackCursor.pop();
        delta=stackDelta.pop();
        parity=stackParity.pop();
        bnum=stackBnums.pop();
        justPopped=true;
      }else{
        if(t==="BRANCH"){
          stackCursor.push(cursor);
          stackDelta.push(delta);
          stackParity.push(parity);
          stackBnums.push(bnum+1);
          //bnum=0;
        }else{
          if(justPopped && bnum>1){
          
          }else{
              bnum=0;
          }
          parity=(parity+1)%2;
          justPopped=false;
        }
        
         var ndelta;
         if(bnum==2 && p.length<=2 && emptyOrigin){
             ndelta=[-delta[0],-delta[1]];
           bnum--;
           emptyOrigin=false;
         }else{
           var buse=bangles;
           var special=false;
           if(p.length>=2){
              if(p[p.length-2].atom.getSymbol()!=="C" &&
                 p[p.length-2].atom.getBondCount()>=4 ){
                  if(!p[p.length-2].atom.isInRing()){
                    buse=altBangles;
                  }else{
                    buse=altBanglesR;
                  }
               }else if(p[p.length-2].atom.getBondCount()>=3){
                  special=true;
               }
           }
            
           var bang = buse[parity][bnum];
           ndelta=[ delta[0]*bang[0]+delta[1]*bang[1],
                   -delta[0]*bang[1]+delta[1]*bang[0]];
            if(bnum>1 && p[p.length-1].atom.getBondCount()==2){
               bnum=1;
            }
           if(special){
             //TODO this is hacky, and we need to fix it
             //the parity calc vs the bnum isn't
             //working as intended
             bnum=0;
           }
         }
           
         cursor=[cursor[0]+ndelta[0],cursor[1]+ndelta[1]];
         delta=ndelta;
        var newAtom = p[p.length-1];
        newAtom.atom.setXYZ(cursor[0],cursor[1]);
        if(cb){
          cb(newAtom.atom);
        }
        //bnum=0;
        //parity=(parity+1)%2;
        
      }
    },null,true, (a,b)=>{
        var ss= gInv[a.atom.getIndexInParent()]-gInv[b.atom.getIndexInParent()];
      
        
      return ss;
    });
    return ret;
    
  };
  ret.transformCoordinates=function(m){
      var basis1=m[0];
    var basis2=m[1];
    ret.getAtoms().map(at=>{
            var x=at.getX();
            var y=at.getY();
        var dot1=x*basis1[0]+y*basis1[1];
        var dot2=x*basis2[0]+y*basis2[1];
        at.setXYZ(dot1,dot2);
    });
    return ret;
  };
  
  // ret.pathNotationDirectionTo
  ret.getShortPathNotation=function(){
      return JSChemify.PathNotation().collapse(ret.getPathNotation());
  };
  ret.setPathNotation=function(pn){
     if(!Array.isArray(pn)){
        pn=JSChemify.PathNotation().expand(pn);
     }
     var startAtom=ret.getAtom(0);
     var got={};
     var gotAtoms={};
     var pthIndex=0;
     var startDx=1;
     var startDy=0;
     
     while(startAtom){
        
        gotAtoms[startAtom.getIndexInParent()]=true;
        startAtom.$allPathsDepthFirst((path)=>{
             if(got[path[path.length-1].bond.getIndexInParent()]){
               return true;
             }  
           
             var atom1=path[path.length-2].atom;
             gotAtoms[atom1.getIndexInParent()]=true;
             if(path.length>2){
                
               var atom2=path[path.length-1].atom;
               gotAtoms[atom2.getIndexInParent()]=true;
               var pth=pn[pthIndex];
               pthIndex++;
               var obond=path[path.length-2].bond;
               var nbond=path[path.length-1].bond;
               var satom=path[path.length-2].atom;
               var ovec = obond.getOtherAtom(satom).getVectorTo(satom);
               nbond.setCoordinatesFromPathNotation(pth,ovec,satom);
               
             }else if(path.length===2){
               var pth=pn[pthIndex];
               pthIndex++;
               var bond=path[path.length-1].bond;
               var satom=path[path.length-1].atom;
               var datom=bond.getOtherAtom(satom);
               bond.setCoordinatesFromPathNotation(pth,[startDx,startDy],datom);
             }
             got[path[path.length-1].bond.getIndexInParent()]=true;
            });
        let latom=startAtom;
        startAtom=null;
        for(let i=0;i<ret.getAtomCount();i++){
            if(!gotAtoms[i]){
               startAtom=ret.getAtom(i);
               break;
            }
        }
        if(startAtom){
            let pdx=startDx;
            let pdy=startDy;
            var pth=pn[pthIndex];
            pthIndex++;
           
            var nvec=JSChemify.PathNotation()
                              .deltaVectorFromPath(pth);
           
            var ovec=[pdx,pdy];
           
            var pvec=[-ovec[1],ovec[0]];
            var nnvec=[ovec[0]*nvec[0]+pvec[0]*nvec[1],
                       ovec[1]*nvec[0]+pvec[1]*nvec[1]];
            startAtom.setXYZ(latom.getX()+nnvec[0],latom.getY()+nnvec[1]);
            let dvec=latom.getVectorTo(startAtom);
            startDx=dvec[0];
            startDy=dvec[1];
            if(startDx===0 && startDy===0){
               startDx=1;
               startDy=0;
            }
        }
     }

     return ret;
  };
  ret.getPathNotation=function(){
     var startAtom=ret.getAtom(0);
     var dpath=[];
     var gotAtoms={};
     var got={};
     var startDx=1;
     var startDy=0;
     
     while(startAtom){
        
        gotAtoms[startAtom.getIndexInParent()]=true;
        startAtom.$allPathsDepthFirst((path)=>{
           if(got[path[path.length-1].bond.getIndexInParent()]){
             return true;
           } 
           var atom1=path[path.length-2].atom;
           gotAtoms[atom1.getIndexInParent()]=true;
           if(path.length>2){
             var atom2=path[path.length-1].atom;
             gotAtoms[atom2.getIndexInParent()]=true;
             var obond=path[path.length-2].bond;
             var nbond=path[path.length-1].bond;
             var satom=path[path.length-2].atom;
             dpath.push(obond.pathNotationDirectionTo(nbond,satom));
           }else if(path.length===2){
             var nn=path[path.length-1].bond.pathNotationDirectionFrom(startDx,startDy,path[0].atom);
             dpath.push(nn);
           }
           got[path[path.length-1].bond.getIndexInParent()]=true;
        });
        let latom=startAtom;
        startAtom=null;
        for(let i=0;i<ret.getAtomCount();i++){
            if(!gotAtoms[i]){
               startAtom=ret.getAtom(i);
               break;
            }
        }
        if(startAtom){
            let pdx=startDx;
            let pdy=startDy;
            let dvec=latom.getVectorTo(startAtom);
            startDx=dvec[0];
            startDy=dvec[1];
           
            let npath=JSChemify.PathNotation()
                               .pathFromDeltaVector([pdx,pdy],
                                                    [startDx,startDy]);
            if(startDx===0 && startDy===0){
               startDx=1;
               startDy=0;
            }
            dpath.push(npath);
        }
     }
     return dpath;
     
  };
  ret.addAtomMaps=function(){
      ret.getAtoms()
         .map((at,i)=>at.setAtomMap(i+1));
      return ret;
  };
  ret.generateCoordinates=function(){
    if(ret.getComponentCount()>1){
       var comps=ret.getComponents();
       comps.map(cc=>cc.generateCoordinates());
       //TODO determine best grid layout and whether
       //to have ionic moieties show near their 
       //counter ions?
       var offsets=[];
       var padding=1.5;
       offsets.push([0,0]);
       var lastBbox=comps[0].getBoundingBox();
       var lastC=[(lastBbox[0]+lastBbox[2])/2,
                  (lastBbox[1]+lastBbox[3])/2];
       //vector which points to the center
       var lastV=[(lastBbox[2]-lastBbox[0])/2,
                  (lastBbox[3]-lastBbox[1])/2];
       for(let i=1;i<comps.length;i++){
           let bbox=comps[i].getBoundingBox();
           let c=[(bbox[0]+bbox[2])/2,
                  (bbox[1]+bbox[3])/2];
           var v=[(bbox[2]-bbox[0])/2,
                  (bbox[3]-bbox[1])/2];
           let targetVector=[
              padding+lastV[0] 
                     +v[0],
              0
           ];
           targetVector[0]+=v[0];
           targetVector[1]+=v[1];
           targetVector[0]-=lastV[0];
           targetVector[1]-=lastV[1];
           offsets.push(targetVector);
           lastBbox=bbox;
           lastC=c;
           lastV=v;
       }
       let acomps = ret.getAtomsInComponents();
       let poff=[0,0];
       comps.map((cc,i)=>{
            let offset=offsets[i];
            let noff=[offset[0]+poff[0],
                      offset[1]+poff[1]];
            poff=noff;
            let oatoms=acomps[i];
            cc.getAtoms().map((aa,j)=>{
               let oAtom=oatoms[j];
               let x=aa.getX() + noff[0];
               let y=aa.getY() + noff[1];
               //console.log([x,y]);
               oAtom.setXYZ(x,y);
            });
       });
       ret.getSGroups().map(sg=>{
         sg.resetBracketLocation();
       });
       return ret;
    }
     
    var atomSet=[];
    var natoms=[];
    var ringSystems=ret.getRingSystems();
    var lRingSystem=null;
    if(ringSystems.length>0){
        
      var rs1= ringSystems[0];
      if(ringSystems.length>1){
        rs1= ringSystems.reduce((a,b)=>{
          if(a.getSize()>b.getSize())return a;
          return b;
        });
      }
      lRingSystem=rs1;
      var startAtom=null;
      var rdelta=null;
      
      while(rs1){
      rs1.getAtoms().map(a=>atomSet.push(a));
      ret.$ringSystemCoordinates(rs1,startAtom,rdelta);
      
      //ret.$ringCoordinates=function(ring,ai,delta, catomXYZ){
  
      rs1.getExternalBonds()
        .map(eb=>{
            if(atomSet.indexOf(eb.bond.getOtherAtom(eb.atom))>=0)return;
            var gbonds=[];
            var delta=eb.atom.getLeastOccupiedVector((na)=>{
                if(atomSet.indexOf(na.atom)>=0){
                  return true;
                }else{
                  gbonds.push(na);
                  return false;
                }
            });

            //Single connection to ring
            if(gbonds.length===1){
              var oat=gbonds[0].atom;
              oat.setXYZ(eb.atom.getX()+delta[0],
                         eb.atom.getY()+delta[1]);
              ret.$treeCoordinates(oat.getIndexInParent(),null,delta,function(bb){
                  if(bb.bond===gbonds[0].bond)return false;
                  return true;
              },function(a){
                if(a.isInRing() && atomSet.indexOf(a)<0){
                  natoms.push(a);
                }
                atomSet.push(a);
              });
            }else{ //2 or more connections
              ret.$treeCoordinates(eb.atom.getIndexInParent(),null,delta,null,function(a){
                if(a.isInRing()&& atomSet.indexOf(a)<0){
                  natoms.push(a);
                }
                atomSet.push(a);
              });
            }
        });
      
        if(natoms.length>0){
           startAtom=natoms.pop();
           rs1 = ringSystems.filter(ra=>ra.hasAtom(startAtom))[0];
           var co=startAtom.getLeastOccupiedVector(nb=>!nb.bond.isInRing());
           rdelta=JSChemify.Util.normVector(co);
        }else{
            rs1=null;
        }
      }
      //ret.$ringCoordinates=function(ring,ai,delta, catomXYZ){
    }else{
        if(ret.getAtomCount()>0){
            ret.$treeCoordinates(0);
      }
    }
    
    //Now do final adjustments
    if(lRingSystem){
      var fused =lRingSystem.getRingBonds()
                            .filter(rb=>rb.getBonds().length===1);
      var centerPt=lRingSystem.getCenterPoint();
        
      if(fused.length>1){
          var sumR=fused.map(f=>f.getRings()
                         .map(r=>r.getSize())
                         .reduce((a,b)=>a+b)
                         )
                       .reduce((a,b)=>{
                       if(a>b)return a;
                       return b;
                       });
          //get closest to the center
          //bond
          fused = [fused
                 .filter(f=>f.getRings()
                                  .map(r=>r.getSize())
                                  .reduce((a,b)=>a+b)>=sumR
                                  )
                 .map(f=>{
                         var bb = f.getBonds()[0];
                     var bpt=bb.getCenterPoint();
                     var dd=JSChemify.Util.sqDist(bpt,centerPt);
                     return [dd,f];
                 }).reduce((a,b)=>{
                     if(a[0]<b[0]){
                       return b;
                   }else{
                       return a;
                   }
                 })[1]];
      }    
                             
      if(fused.length===1){
        var bb=fused[0].getBonds()[0];
        var vec=bb.getAtoms()[1].getVectorTo(bb.getAtoms()[0]);
        var dot1=vec[0];
        var dot2=vec[1];
        var rej1=Math.sqrt()
        var trans=[
        [-dot2,dot1],
        [dot1,dot2]
        ];
        
        var nvec=[trans[0][0]*vec[0]+trans[0][1]*vec[1],
                             trans[1][0]*vec[0]+trans[1][1]*vec[1]];
        ret.transformCoordinates(trans);
        
        //TODO do better with dirtiness
        lRingSystem.$center=null;
        lRingSystem.getRings().map(rr=>rr.$center=null);
      }     
      
      //Now decide if we flip it horizontally
      var flipHorizontal=1;
      var flipVertical=1;
      centerPt=lRingSystem.getCenterPoint();
      var smallestRingCenter = lRingSystem.getRings().reduce((a,b)=>{
        if(a.getSize()<b.getSize())return a;
        return b;
        }).getCenterPoint();
      if(smallestRingCenter[0]<centerPt[0])flipHorizontal=-1;
      if(smallestRingCenter[1]<centerPt[1])flipVertical=-1;
      if(flipHorizontal + flipVertical<2){
        var trans=[
          [flipHorizontal,0],
          [0,flipVertical]
          ];
         ret.transformCoordinates(trans);
        //TODO do better with dirtiness
        lRingSystem.$center=null;
        lRingSystem.getRings().map(rr=>rr.$center=null);
      }                   
    }else{
      //get longest continual chain, rotare it to be
      //horizontal
    }

    var isDebug=false;
    var debug=0;
    var maxdebug=200;
    //This will look if some atoms are too close
    var clusters=ret.$getCloseClustersOfAtoms();
    //clusters=[];
    if(clusters.length>0){
      var iters=0;
      var MAX_ITERS=20;

      
      while(clusters.length>0){
        if(iters>MAX_ITERS)break;
        iters++;
        var adjAtoms=ret.getLayoutAdjustableAtoms();
        var cluster1=clusters.pop();
        var atom1=cluster1[0];
        var atom2=cluster1[1];
        adjAtoms.sort((a,b)=>{
            var diff=a.getBondCount()-b.getBondCount();
            if(diff!==0)return diff;
            var d1a=a.getShortestAtomDistance(atom1);
            var d2a=a.getShortestAtomDistance(atom2);
            var d1b=b.getShortestAtomDistance(atom1);
            var d2b=b.getShortestAtomDistance(atom2);
            if(Math.min(d1a,d2a)<Math.min(d1b,d2b)){
                return -1;
            }
            return 1;
        });
        var breakOut=false;
        for(var i=0;i<adjAtoms.length;i++){
          if(breakOut)break;
          var aatom=adjAtoms[i];
          var network=aatom.getConnectedNetworkAndBonds();
          var net1=network.find(bn=>{
              return bn.network[atom1.getIndexInParent()];
          });
          var net2=network.find(bn=>{
              return bn.network[atom2.getIndexInParent()];
          });
          var othernets = network.filter(nn=>nn!==net1 && nn!==net2);
          //TODO: consider the following:
          // 1. Rotate the blocking group to the area with most space
          //    if it were not present
          // 2. Extend the blocking group bond length
          // 3. wiggle the atoms so that the convex hull isn't
          //    intersecting anymore
          // None of these are done at the moment
          
          if(net1!==net2 && (net1) && (net2)){
             debug++;
            var nlist=[net1,net2];
            for(var ii=0;ii<nlist.length;ii++){
              if(breakOut)break;
              var smallerNet=nlist[ii];
              var nvecs=[];
  
              if(aatom.getBonds().length===2){
                nvecs.push({"net":null, "vec":(()=>{
                   var rrvec=aatom.getVectorAwayFromNeighborCenters();
                   return rrvec;
                   })});
              }else{
                othernets.map(on=>{
                  var cAtom = on.bond.getOtherAtom(aatom);
                  nvecs.push({"net":on, "vec":(()=>aatom.getVectorTo(cAtom))});
                })
              }
              if(isDebug){
                ret.getAtoms().map(a=>a.setAtomMap(0));
              }
              while(nvecs.length>0){
                var nvecT=nvecs.pop();
                var nvec=nvecT.vec();
  
                var ovec=aatom.getVectorTo(smallerNet.bond.getOtherAtom(aatom));
                var cVec=[aatom.getX(),aatom.getY()];
                var mat=JSChemify.Util.getTransformFromVectorToVector(ovec,nvec);
                var revmat=JSChemify.Util.getTransformFromVectorToVector(nvec,ovec);
                var oldXY=ret.getAtoms().map(a=>[a.getX(),a.getY()]);
                var vecs=Object.keys(smallerNet.network)
                      .map(ai=>ret.getAtom(ai))
                      .map(at=>{
                         if(isDebug){
                            return at.setAtomMap(2)
                         }
                         return at;
                      })
                      .map(at=>at.getVectorTo(aatom))
                      .map(v=>JSChemify.Util.matrixMultiply(mat,v))
                      .map(v=>JSChemify.Util.addVector(v,cVec));

                 if(debug<=maxdebug){
                   Object.keys(smallerNet.network)
                         .map((ai,i)=>ret.getAtom(ai).setXYZ(vecs[i][0],vecs[i][1]));
                 }
                if(nvecT.net){;
                  var vecs2=Object.keys(nvecT.net.network)
                        .map(ai=>ret.getAtom(ai))
                        .map(at=>{
                            if(isDebug){
                               return at.setAtomMap(3)
                            }
                            return at;
                         })
                        .map(at=>at.getVectorTo(aatom))
                        .map(v=>JSChemify.Util.matrixMultiply(revmat,v))
                        .map(v=>JSChemify.Util.addVector(v,cVec));
                  if(debug<=maxdebug){
                  Object.keys(nvecT.net.network)
                        .map((ai,i)=>ret.getAtom(ai).setXYZ(vecs2[i][0],vecs2[i][1]));
                  }
                }
                var nclusters=ret.$getCloseClustersOfAtoms();
                 if(debug>maxdebug){
                    nclusters=[];
                 }
                if(nclusters.length===0){
                  // it worked!
                  clusters=nclusters;
                  breakOut=true;
                  break;
                }
                if(nclusters.length<=clusters.length){
                  clusters=nclusters;
                  breakOut=true;
                  break;
                }else{
                  //Put it back
                  oldXY.map((xv,i)=>ret.getAtom(i).setXYZ(xv[0],xv[1]));
                }
              }
            
            }//for each network that has a collision
            if(!breakOut){
            
            }
          }//if(net1!==net2)
        }
        
      }
    } //while there are clusters to resolve
    
    
    ret.getAtoms().map(a=>a.setStereoBondFromParity());
    ret.getSGroups().map(sg=>{
         sg.resetBracketLocation();
       });
     
    return ret;
  };
  
  
  ret.getGraphInvariant=function(){
      if(!ret.$graphInvariant){
      //morgan's algo
      //This one ignores atom labels, bond order, stereo
      //I don't know why, but this one does a better
      //job estimating "bulkiness"
      var blab = ret.getAtoms().map(a=>a.getBondCount());
      var blab2 = blab.map(b=>b);
      var tucount=0;
      for(var i=0;i<ret.getAtomCount();i++){
        var mult=1;

        for(var j=0;j<ret.getAtomCount();j++){
          var nm = ret.getAtom(j)
             .getNeighborAtomsAndBonds()
             .map(n=>n.atom.getIndexInParent())
             .map(ni=>mult*blab[ni])
             .reduce((a,b)=>a+b,0);
          blab2[j]=nm+blab[j];
        }
        var ucount = JSChemify.Util.distinct(blab2).length;
        var t=blab2;
        blab2=blab;
        blab=t;
        if(ucount===tucount){
          break;
        }
      }
      
      blab2=blab.map(b=>b).sort((a,b)=>a-b);
      blab=blab.map(b=>blab2.indexOf(b));
      
      
      ret.$graphInvariant= blab;
    }
    return ret.$graphInvariant;
  };
  
  
  
  ret.getAtom = function(i){
      return ret._atoms[i];
  };
  ret.getBond = function(i){
      return ret._bonds[i];
  };
  ret.setName =function(n){
    ret._name=n;
    return ret;
  };
  ret.getName =function(){
    return ret._name;
  };
  ret.getIndexOf= function(o){
      if(JSChemify.Util.isAtom(o)){
        return ret._atoms.indexOf(o);
    }else if(JSChemify.Util.isBond(o)){
        return ret._bonds.indexOf(o);
    }
    //TODO: consider this, error?
    return -1;
  };
  //TODO: cache somehow
  ret.hasCoordinates=function(){
   return ret.getAtoms().findIndex(a=>(a.getX()||a.getY()))>=0;
  };

  ret.getPNGPromise=function(width,height,renderer){
     if(!renderer){
        renderer=JSChemify.Renderer();
     }
     return renderer.getPNGPromise(ret,width,height);
  };
  ret.getSVGPromise=function(width,height,renderer){
     if(!renderer){
        renderer=JSChemify.Renderer();
     }
     return renderer.getSVGPromise(ret,width,height);
  };
   
  ret.getSVG=function(width,height,renderer){
     if(!renderer){
        renderer=JSChemify.Renderer();
     }
     return renderer.getSVG(ret,width,height);
  };
  ret.getBoundingBox=function(){
    let pts=ret.getAtoms().map(at=>at.getPoint());
    ret.getSGroups().map(sg=>{
         sg.getBracketLocation().map(bloc=>{
             pts.push(bloc[0]);
             pts.push(bloc[1]);
         });
    });
     
    return JSChemify.ShapeUtils()
                    .getBoundingBox(pts,1);
  };
  ret.getComponentCount=function(){
      if(!ret.$componentCount){
         let acomps=ret.getAtomsInComponents();
         ret.$componentCount = acomps.length;
      }
     return ret.$componentCount;
  };
  ret.getComponents=function(){
      
      let cats= ret.getAtomsInComponents();
      return cats.map(carr=>{
         let bonds=JSChemify.Util.distinct(carr.flatMap(at=>at.getBonds()));
         let chem =JSChemify.Chemical();
         var oAmap=[];
         carr.map(at=>{
            var natom= chem.addAtom(at.clone());
            oAmap[at.getIndexInParent()]=natom;
         });
         bonds.map(bd=>{
            var bbond= bd.clone();
            bbond._atom1=oAmap[bd._atom1.getIndexInParent()];
            bbond._atom2=oAmap[bd._atom2.getIndexInParent()];
            
            chem.addBond(bbond);
         });
         //all components the same
         chem.$atomComponentTypes=chem.getAtoms()
                                      .map((a,i)=>1);
         chem.$componentCount=1;
         return chem;
      });
  };
  ret.getAtomsInComponents=function(){
      if(!ret.$atomComponentTypes){
         //force the generation of
         //stuff
         ret.getRings();
      }
     var cAtoms=[];
     ret.$atomComponentTypes.map((c,i)=>{
         var cInd=c-1;
         if(!cAtoms[cInd]){
            cAtoms[cInd]=[];
         }
         cAtoms[cInd].push(ret.getAtom(i));
     });
     return cAtoms;
  };
  ret.getBonds=function(){
      return ret._bonds;
  };
  ret.getMolFormula=function(){
      var counts={};
    var addTo=(s,v)=>{
        counts[s]=((counts[s])?counts[s]:0)+v;
    };
    ret.getAtoms()
       .map(a=>{
           var iH=a.getImplicitHydrogens();
        addTo("H",iH);
        addTo(a.getSymbol(),1);
       });
    var pref="";
    var org=false;
    if(counts["C"]>0) {
        pref="C"  + ((counts["C"]>1)?counts["C"]:"");
         if(counts["H"]>0) {
          pref+="H"  + ((counts["H"]>1)?counts["H"]:"");
      }
        org=true;
    }
    return pref +
            Object.keys(counts)
                  .filter(k=>(k!=="C") && (!org||k!=="H"))
                  .sort()
                  .map(k=>{
                    return k + ((counts[k]>1)?counts[k]:"");
                  }).join("");
    
  };
  ret.getMolWeight=function(){
     var wt= ret.getAtoms()
              .map(a=>a.getMass())
              .reduce((a,b)=>a+b,0);
     var hs= ret.getAtoms()
         .map(a=>a.getImplicitHydrogens())
         .filter(h=>(h>0))
         .reduce((a,b)=>a+b,0);
         
     var hweight=JSChemify.Util
              .getElementFromSymbol("H")
                         .mass;
     return wt+hs*hweight;
  };
  ret.removeBond=function(b){
      var ib=b.getIndexInParent();
    ret._bonds.splice(ib,1);
    return {"index": ib, "bond":b};
  };
  
  ret.$markDirty=function(){
    ret.$bondTypes=null;
    ret.$atomComponentTypes=null;
    ret.$atomDistances=null;
    ret._rings=null;
    ret.$graphInvarient=null;
    ret.$$dirty++;
    ret.$EstateVector=null;
  };
  ret.$dirtyNumber=function(){
      return ret.$$dirty;
  };
  
  ret.$getCloseClustersOfAtoms=function(tooClose){
      if(!tooClose)tooClose=0.3;
      var clusters=ret.getAtoms()
       .map(a=>a.getAtomsCloserThan(tooClose).concat(a))
       .filter(aa=>aa.length>1)
       .map(aa=>aa.sort((a,b)=>{
          if(a.getIndexInParent()<b.getIndexInParent()){
            return 1;
          }
            return -1;
       }))
       .map(aa=>{
           var mm={};
        mm[aa[0].getIndexInParent()]=aa;
           return mm;
       })
       .reduce((a,b)=>{
            //TODO: technically this should probably
          //do transitive closure
          Object.keys(b).map(bk=>a[bk]=b[bk]);
          return a;
       },{});
     return Object.values(clusters);  
  };
  
  ret.aromatize=function(){
      //TODO implement this
    var aRings=ret.getRings()
                                .filter(r=>r.isAromatic());
    aRings.flatMap(r=>r.getBonds())
                 .map(b=>b.setBondOrder(4));
           
    return ret;
  };
  
  ret.dearomatize=function(){
    //TODO implement this better
    var stack=ret.getRings()
                 .filter(r=>r.isAromatic())
                 .filter(r=>r.getBonds().filter(bb=>bb.getBondOrder()==4).length>0);
    
    stack.sort((a,b)=>{
        return a.getNeighborRingsAndBonds().length-b.getNeighborRingsAndBonds().length;
    });
    var done=[];
    while(stack.length>0){
      var nextRing=stack.pop();
      if(done.indexOf(nextRing)<0){
      
        nextRing.dearomatize();
        done.push(nextRing);
        nextRing.getNeighborRingsAndBonds()
                .map(r=>{
                    if(stack.indexOf(r.ring)>=0){
                        stack.push(r.ring);
                  }
                });
      }
    }
               
           
    return ret;
  };
  
  ret.getAtoms=function(){
      return ret._atoms;
  };
  
  ret.getAverageBondLength=function(){
      var stat= ret.getBonds()
              .map(b=>b._atom1.getVectorTo(b._atom2))
              .map(b=>JSChemify.Util.sqMagVector(b))
              .map(b=>[Math.sqrt(b),1])
              .reduce(JSChemify.Util.addVector);
    return stat[0]/stat[1];
  };
  
  
  ret.getRings=function(){
      ret.$detectRings();
    return ret._rings;
  };
  
  ret.getRingSystems=function(){
      if(ret.$ringSystems){
     return ret.$ringSystems;
    }
    var rings = ret.getRings();
    var srings = rings.filter(r=>!r.isEnvelope());
    
    var idx=srings.map((a,i)=>i);
    var rbonds=[];
    
    for(var i=0;i<srings.length;i++){
        var tring=srings[i];
        for(var j=i+1;j<srings.length;j++){
          var nring =srings[j];
        var rbond = tring.getRingBond(nring);
        if(rbond!=null){
            rbonds.push({"idx":i,"rb":rbond});
            var mi=Math.min(idx[j],idx[i]);
          if(mi<idx[i]){
              for(var k=0;k<srings.length;k++){
                if(idx[k]===idx[i]){
                  idx[k]=mi;
              }
            }
          }
          idx[i]=mi;
          idx[j]=mi;
        }
      }
    }
    var rMap={};
    
    rbonds.map(irb=>{
        var ii=irb.idx;
        var rb=irb.rb;
      var lindex=idx[ii];
      var mm=rMap[lindex];
      if(!mm){
       mm=[];
       rMap[lindex]=mm;
      }
      mm.push(irb.rb);
    });
    var sRingsGrouped={};
    idx.map((a,i)=>{
        var ma=sRingsGrouped[a];
      if(!ma){
          ma=[];
        sRingsGrouped[a]=ma;
      }
        ma.push(srings[i]);
    });
    
    ret.$ringSystems= Object.keys(sRingsGrouped).map(k=>{
        var rbonds = rMap[k];
      var rrings = sRingsGrouped[k];
      if(!rbonds)rbonds=[];
        return JSChemify.RingSystem(rrings, rbonds);
    });
    return ret.$ringSystems;
  }
  
  ret.isRingBond=function(bd){
      var bidx=bd.getIndexInParent();
    ret.$detectRings();
    if(ret.$bondTypes[bidx]==="RING"){
        return true;
    }
    return false;
  };
  ret.getShortestAtomDistance=function(atom1,atom2){
          var ai1=atom1.getIndexInParent();
      var ai2=atom1.getIndexInParent();
      ret.$calculateDistances();
     
      var sDist= ret.$atomDistances[ai1][ai2];
      if(sDist>=0)return sDist;
      return -1;
  };
  ret.getNeighborAtomsAtDistance=function(atom,d){
      var ai1=atom.getIndexInParent();
    ret.$calculateDistances();
    return ret.$atomDistances[ai1].map((d,i)=>[d,i]).filter(dd=>dd[0]===d).map(di=>ret.getAtom(di[1]));
    
  }
  ret.getConnectivityIndexSGeo = function(order){
      return ret.getConnectivityIndexS(order,(v,o)=>1/Math.pow(v,1/(1+o)));
  };
  ret.getConnectivityIndexVGeo = function(order,averager){
      return ret.getConnectivityIndexV(order,(v,o)=>1/Math.pow(v,1/(1+o)));
  };
  ret.getConnectivityIndexS = function(order,averager){
      //Probably should be geometric average
      if(!averager)averager=(v)=>1/Math.sqrt(v);
      return ret.getConnectivityIndex(order, (a)=>a.getDelta(),averager);
  };
  ret.getConnectivityIndexV = function(order,averager){
      if(!averager)averager=(v)=>1/Math.sqrt(v);
      return ret.getConnectivityIndex(order, (a)=>a.getDeltaV(),averager);
  };
  ret.getConnectivityIndex=function(order, deltaMaker, averager) {
      var lookup = ret.getAtoms()
                     .map(aa=>deltaMaker(aa));
    var matoms;
    var cType;
    order+="";
    if(order.endsWith("p") || order.endsWith("c")){
        cType = order.replace(/[0-9]/g, "");
      order = order.replace(/[^0-9]/g,"")-0;
      
    }
    if(!cType)cType="p";//path
    
    var doPath= cType.startsWith("p") || order<=2;
    var doCluster = (order>=3) && cType.endsWith("c")
    
    
    matoms = ret.getAtoms().map(aa=>[aa]);
    
    //This gets paths
    
    
    for(var i=0;i<order;i++){
        var cSet = {};
      matoms= matoms.flatMap(ml=>{
        var head = ml[0];
        var tail = ml[ml.length-1];
        var append=[];
        var prepend = head.getNeighborAtomsAndBonds()
        .map(na=>na.atom)
        .filter(na=>ml.indexOf(na)<0);
        var inserts=[];

        if(head!==tail){
            if(doCluster){
              for(var j=1;j<ml.length-1;j++){
               var inew= ml[j].getNeighborAtomsAndBonds()
                   .map(na=>na.atom)
                   .filter(na=>ml.indexOf(na)<0);
               inserts.push({"idx":j, "atoms":inew});
            }
          }
          append = head.getNeighborAtomsAndBonds()
            .map(na=>na.atom)
            .filter(na=>ml.indexOf(na)<0);
        }
        var plist = prepend.map(pp=>[pp].concat(ml));
        var alist = append.map(pp=>ml.concat([pp]));
        var ilist = inserts.flatMap(is=>{
                var nhead= ml.slice(0,is.idx);
            var ntail= ml.slice(is.idx,ml.length);
            return is.atoms.map(a=>nhead.concat([a]).concat(ntail));
        });
        if(i==2 && !doPath){
          return ilist;
        }
        return plist.concat(ilist)
                    .concat(alist);
      })
        .filter(ml=>{
          if(i<3 || !doCluster){
            var head = ml[0];
            var tail = ml[ml.length-1];
            //deduplication
            return head.getIndexInParent()<tail.getIndexInParent();
          }else{
              var canon=ml.map(at=>at.getIndexInParent()).sort().join(",");
            if(cSet[canon]){
                return false;
            }else{
                cSet[canon]=true;
            }
            return true;
          }
      });
    }
    
    var sum1= matoms.map(mal=>{
             var prod = mal.map(mm=>lookup[mm.getIndexInParent()])
                                 .reduce((a,b)=>a*b,1);
        return averager(prod,order);
    }).reduce((a,b)=>a+b,0);
    return sum1;        
                     
  };
  ret.$calculateDistances = function(){
    var MAX_DISTANCE=20;
      if(ret.$atomDistances)return ret;
    var soFar=[];
    var shortest=[];
    for(var i=0;i<ret._atoms.length;i++){
        var natoms=ret.getAtom(i).getNeighborAtomsAndBonds().map(a=>a.atom.getIndexInParent());
      shortest[i]=[];
      shortest[i][i]=0;
      soFar[i]=[natoms];
      natoms.map(ni=>shortest[i][ni]=1);
    }
    for(var d=0;d<MAX_DISTANCE;d++){
        for(var i=0;i<ret._atoms.length;i++){
          var dVec=soFar[i];
        var lastDVec=soFar[i][d];
        var newIndexes=JSChemify.Util.distinct(lastDVec.flatMap(di=>soFar[di][0])
                                                 .filter(ni=>!(shortest[i][ni]>=0)));
        newIndexes.map(ni=>shortest[i][ni]=d+2);
        soFar[i][d+1]=newIndexes;
      }
    }
    ret.$atomDistances=shortest;
    return ret;
    
  };
  ret.$detectRings = function(){
      if(ret.$bondTypes)return ret;
      
      for(var i=0;i<ret._bonds.length;i++){
          ret._bonds[i]._idx=i;
      }
      var bTypes=[];
      var aTypes=[];
      var assigned=0;
      var rings={};
      
      var remainingBonds = ret._bonds.filter(b=>!bTypes[b._idx]);
      var comp=1;
      while(remainingBonds.length>0){
        var startAtom = remainingBonds[0].getAtoms()[0];
        
        startAtom.$allPathsDepthFirst((path)=>{
          var lbond=path[path.length-1];
          var first=path.findIndex(p=>p.atom===lbond.atom);
        
          if(first<path.length-1){
              var nring=[];
              for(var j=first+1;j<path.length;j++){
                var pnode=path[j].bond;
              if(!bTypes[pnode._idx]){
                  assigned++;
              }
              nring.push(pnode);
              bTypes[pnode._idx]="RING";
              aTypes[pnode._atom1.getIndexInParent()]=comp;
              aTypes[pnode._atom2.getIndexInParent()]=comp;
            }
            var cRing=JSChemify.Ring(nring).canonicalize();
            rings[cRing.toString()]=cRing;
            //stop going on this path
            return true;
          }else{
               if(!bTypes[lbond.bond._idx]){
                 bTypes[lbond.bond._idx]="CHAIN";
                 aTypes[lbond.bond._atom1.getIndexInParent()]=comp;
                 aTypes[lbond.bond._atom2.getIndexInParent()]=comp;
                 assigned++;
               }
          }
        });
        remainingBonds = ret._bonds.filter(b=>!bTypes[b._idx]);
        comp++;
      }
      ret.getAtoms().map((a,i)=>{
         if(!aTypes[i]){
            aTypes[i]=comp;
            comp++;
         }
      });
      ret.$bondTypes=bTypes;
      ret.$atomComponentTypes=aTypes;
      ret._rings=Object.values(rings);
      return ret;
      
  };
  ret.$detectRingsEXP=function(){
          for(var i=0;i<ret._bonds.length;i++){
          ret._bonds[i]._idx=i;
      };
      var bcount = ret._bonds.length;
          var removedBonds = ret._removeAllFoliage();
      var bTypes=[];
      var assigned=0;
      
      removedBonds.map(rb=>{
          bTypes[rb.index]="FOLIAGE";
          assigned++;
      });
      
      
      //At this point anything left is either a linker or a ring
      //Now mark anything that has more than 2 bonds
      var terts = ret.getAtoms().filter(at=>at.getBondCount()>=3);
      var branchBonds=JSChemify.distinct(terts.flatMap(at=>at.getBonds()));
      
      var ringsPlusComponents = ()=>{
          return ret._bonds.length.length + ret.getAtoms().filter(at=>at.getBondCount()>0).length +2;
      };
      var RINGS_PLUS_COMPONENTS=ringsPlusComponents();
      for(var i=0;i<branchBonds.length;i++){
          var toRemoveBond = branchBonds[i];
        
          //ret._removeAllFoliage
      }
      
      
  };
  
  ret.isAtomInRing=function(at){
      return at.getBonds().findIndex(b=>ret.isBondInRing(b))>=0;
  };
  ret.isBondInRing=function(bd){
         ret.$detectRings();
    return ret.$bondTypes[bd.getIndexInParent()]==="RING"; 
  };
  
  ret.addAtom = function(at){
    if(at && at._chemType && at._chemType === JSChemify.CONSTANTS.CHEM_TYPE_ATOM){
        ret._atoms.push(at);
        at.setParent(ret);
    }
    ret.$markDirty();
    //should this return the parent molecule or the atom?
    return at;
  };

  ret.addSGroup = function(sg){
    if(sg && sg._chemType && sg._chemType === JSChemify.CONSTANTS.CHEM_TYPE_SGROUP){
      ret._sgroups.push(sg);
      sg.setParent(ret);
    }
    ret.$markDirty();
    return sg;
  };
  
  ret.addBond = function(bd){
    if(JSChemify.Util.isBond(bd)){
      ret._bonds.push(bd);
      bd.setParent(ret);
    }
    ret.$markDirty();
    return bd;
  };
  ret.addNewBond = function(atom1,atom2, bondOrder, bondStereo){
      var bd=JSChemify.Bond().setParent(ret).setBond(atom1,atom2,bondOrder,bondStereo);
    return ret.addBond(bd);
  };
  ret.addNewAtom = function(symbol){
    var at=JSChemify.Atom().setSymbol(symbol);
    return ret.addAtom(at);
  };
  ret.getSGroups = function(){
      return ret._sgroups;
  };
  ret.addNewSGroup = function(num){
    if(!num){
       num=ret._sgroups.length+1;
    }
    var sg=JSChemify.SGroup()
                    .setIndex(num);
    return ret.addSGroup(sg);
  };
  ret.getSGroupByIndex=function(n){
     return ret._sgroups.find(sg=>sg.getIndex()===n);
  };
  
  ret.getBondsTo=function(at){
      return ret._bonds.filter(bd=>bd.containsAtom(at));
  };
  ret.getAtomCount=function(){
      return ret._atoms.length;
  };
  
  ret.getBondCount=function(){
      return ret._bonds.length;
  };
  
  ret.getEStateVector=function(d){
    if(!ret.$EstateVector){
       var vec={};
       if(!d)d=1;
       ret.getAtoms()
           .filter(at=>at.getSymbol()!=="H")
           .map(at=>[at,at.getEState()])
           .flatMap(aa=>{
               return [
                   [aa[0].getKierHallAtomType(),aa[1]],
                   [aa[0].getKierHallAtomType2(),aa[1]],
               ].slice(0,d);
           })
           .map(vv=>{
               var o=vec[vv[0]];
               if(!o)o=0;
               o+=vv[1];
               vec[vv[0]]=o;
           });
       ret.$EstateVector= JSChemify.EState(vec);
    }
    return ret.$EstateVector;
  };
  ret.fromMol=function(lines,start){
      return ret.readNextMol(lines,start).chem;
  };
  ret.readNextMol=function(lines,start){
    if(!Array.isArray(lines)){
         lines= lines.split("\n");
    }
    if(!start)start=0;
    let name=lines[start];
    if(name){
       ret.setName(name);
    }
    //console.log(start);
    //console.log(lines[start]);
    var acount=lines[3+start].substr(0,3).trim()-0;
    var bcount=lines[3+start].substr(3,3).trim()-0;
    let cursor=start;
    for(let i=0;i<acount;i++){
        ret.addNewAtom("A").fromMolLine(lines[3+i+1+cursor]);
    }
    for(let i=0;i<bcount;i++){
        ret.addNewBond(0,0,0,0).fromMolLine(lines[3+acount+i+1+cursor]);
    }
    cursor=3+acount+bcount+1+cursor;
    for(;cursor<lines.length;cursor++){
      let line=lines[cursor];
      let m=/M[ ][ ]END/y.exec(line);
      if(m){
         cursor++;
         break;
      }
      //"M  CHG  2  11  -1  21   1"
      let mline=/M[ ][ ]([A-Z][A-Z][A-Z])[ ]*([0-9][0-9]*)(.*)/y.exec(line);
      if(mline){
            let mtype=mline[1];
            let mcount=mline[2];
            let mvals=mline[3];
         
               /*
M  STY  1   1 MUL
M  SAL   1  8  24  25  26  27  28  29  30  31
M  SAL   1  4  32  33  34  35
M  SPA   1  6  24  25  26  27  28  29
M  SDI   1  4    7.4880   -6.1360    7.4880   -1.1960
M  SDI   1  4   12.6360   -1.1960   12.6360   -6.1360
M  SMT   1 2
M  SCN  2   1 HT    2 HT 
                  */
            if(mtype === "CHG" || mtype === "ISO" 
               || mtype === "STY" || mtype === "SCN"){
               for(let k=0;k<mvals.length;k+=8){
                  let at=mvals.substr(k,4).trim()-0;
                  let val=mvals.substr(k+4,4).trim();
                  if(mtype==="CHG"){
                     ret.getAtom(at-1).setCharge(val-0);
                  }else if(mtype==="ISO"){
                     ret.getAtom(at-1).setIsotope(val-0);
                  }else if(mtype==="STY"){
                     ret.addNewSGroup(at)
                        .setType(val);
                  }else if(mtype==="SCN"){
                     ret.getSGroupByIndex(at)
                        .setConnectivity(val);
                  }
               }
            }else if(mtype[0] === "S"){
               let sid = mcount.trim()-0;
               let sgroup = ret.getSGroupByIndex(sid);
               //
               if(mtype === "SMT"){
                  let lab = mvals.substr(0,4).trim();
                  sgroup.setLabel(lab);
               }else if(mtype === "SDI"){
                  mvals = mvals.substr(3);
                  let cord=[];
                  for(let k=0;k<mvals.length;k+=10){
                     let pos=mvals.substr(k,10).trim()-0;
                     cord.push(pos);
                  }
                  sgroup.addBracketXY([cord[0],cord[1]],[cord[2],cord[3]]);
               }else if(mtype === "SAL" || mtype === "SPA"){
                  let cnt = mvals.substr(0,3).trim()-0;
                  mvals = mvals.substr(3);
                  for(let k=0;k<mvals.length;k+=4){
                     let at=mvals.substr(k,4).trim()-0;
                     let sgro
                     if(mtype === "SAL"){
                        sgroup.addAtom(ret.getAtom(at-1));
                     }else if(mtype==="SPA"){
                        sgroup.addDisplayAtom(ret.getAtom(at-1));
                     }
                  }
               }
            }
      }
    }
    let cend= ret.readSDProperties(lines,cursor).cursor;
    return {cursor:cend,chem:ret};
  };
  ret.readSDProperties=function(lines, start){
    let cprop=null;
    let cvals=[];
    if(!start)start=0;
    let cursor=lines.length;
    for(let i=start;i<lines.length;i++){
         let line=lines[i].trim();
         let m = />([^<]*)[<]([^>]*)[>]/y.exec(line); 
         if(m){
            if(cprop){
               ret.setProperty(cprop,cvals.join("\n"));
            }
            cprop=m[2];
            cvals=[];
         }else{
            let m = /\$\$\$\$/y.exec(line);
            if(!m){
               if(line.length>0){
                  cvals.push(line);
               }
            }else{
               if(cprop){
                  ret.setProperty(cprop,cvals.join("\n"));
               }
               cursor=i+1;
               break;
            }
         }
    }
    return {"cursor": cursor, "chem": ret};
  };
  
  ret.toMol=function(){
    var d=new Date();
    var mmddyyhhmm=("0"+d.getDate()).substr(-2) + ("0"+d.getMonth()).substr(-2)+ ("0"+d.getYear()).substr(-2)+ ("0"+d.getHours()).substr(-2)+ ("0"+d.getMinutes()).substr(-2);
    var line2="JSChemify0"+mmddyyhhmm+"2D";
    var counts=("   "+ret.getAtomCount()).substr(-3) + ("   "+ret.getBondCount()).substr(-3);
    var mol="\n" + line2 + "\n\n"+counts+"  0  0  0  0              0 V2000\n";

    var atab=ret._atoms.map(at=>at.toMolLine()).join("\n");
    if(atab)mol+=atab;

    var btab=ret._bonds.map(bd=>bd.toMolLine()).join("\n");
    if(atab)mol+="\n" +btab;
    if(btab)mol+="\n";
    mol+=ret.molMBlocks();
    mol+=ret.molSBlocks();
    mol+="M  END";
    return mol;
  };
  ret.molSBlocks=function(){
     var buff=[];
     ret.getSGroups().map(sg=>{
         let num = sg.getIndex();
         let type = sg.getType();
         let lab = sg.getLabel();
         let bloc= sg.getBracketLocation();
         let con = sg.getConnectivity();
         buff.push("M  STY  1");
         buff.push(("    "+num).substr(-4));
         buff.push(("    "+type).substr(-4));
         buff.push("\n");
         var catoms = sg.getAtoms();
         for(var i=0;i<catoms.length;i+=8){
            var salAtoms=Math.min(catoms.length,i+8)-i;
            buff.push("M  SAL");
            buff.push(("    "+num).substr(-4));
            buff.push(("    "+salAtoms).substr(-3));
            for(var j=i;j<Math.min(catoms.length,i+8);j++){
               var indx=catoms[j].getIndexInParent()+1;
               buff.push(("   "+ indx).substr(-4));
            }
            buff.push("\n");
         }
         var datoms=sg.getDisplayAtoms();
         if(datoms.length!==catoms.length){
            catoms = datoms;
            for(var i=0;i<catoms.length;i+=8){
               var salAtoms=Math.min(catoms.length,i+8)-i;
               buff.push("M  SPA");
               buff.push(("    "+num).substr(-4));
               buff.push(("    "+salAtoms).substr(-3));
               for(var j=i;j<Math.min(catoms.length,i+8);j++){
                  var indx=catoms[j].getIndexInParent()+1;
                  buff.push(("   "+ indx).substr(-4));
               }
               buff.push("\n");
            }
         }
         if(lab){
            buff.push("M  SMT");
            buff.push(("    "+num).substr(-4));
            buff.push(" " + lab);
            buff.push("\n");
         }
         bloc.map(bl=>{
            //M  SDI   1  4
            buff.push("M  SDI");
            buff.push(("    "+num).substr(-4));
            buff.push("  4");
            buff.push(JSChemify.Util.toMolDouble(bl[0][0]));
            buff.push(JSChemify.Util.toMolDouble(bl[0][1]));
            buff.push(JSChemify.Util.toMolDouble(bl[1][0]));
            buff.push(JSChemify.Util.toMolDouble(bl[1][1]));
            buff.push("\n");
         });
         if(con){
            
            buff.push("M  SCN");
            buff.push("  1");
            buff.push(("    "+num).substr(-4));
            buff.push(" ");
            buff.push((con+"   ").substr(0,3));
            buff.push("\n");
         }
        
     });
     return buff.join("");
  };
  ret.molMBlocks=function(){
    var buff=[];
    //Charges
    var catoms=ret.getAtoms()
                  .filter(at=>at.getCharge()!==0);
    if(catoms.length>0){
        for(var i=0;i<catoms.length;i+=8){
          //"M  CHG  2  11  -1  21   1"
          buff.push("M  CHG  ");
          var chgAtoms=Math.min(catoms.length,i+8)-i;
          buff.push(chgAtoms);
          for(var j=i;j<Math.min(catoms.length,i+8);j++){
            var indx=catoms[j].getIndexInParent()+1;
            var chg=catoms[j].getCharge();
            buff.push(("   "+ indx).substr(-4));
            buff.push(("   "+ chg).substr(-4));
          }
          buff.push("\n");
      }
    }
    //isotopes
    var iatoms=ret.getAtoms().filter(at=>at.getIsotope()!==0);
    if(iatoms.length>0){
        for(var i=0;i<iatoms.length;i+=8){
          //"M  ISO  1  16  11"
          buff.push("M  ISO  ");
        var isoAtoms=Math.min(iatoms.length,i+8)-i;
        buff.push(isoAtoms);
          for(var j=i;j<Math.min(iatoms.length,i+8);j++){
            var indx=iatoms[j].getIndexInParent()+1;
          var iso=iatoms[j].getIsotope();
          buff.push(("   "+ indx).substr(-4));
          buff.push(("   "+ iso).substr(-4));
        }
        buff.push("\n");
      }
    }
    return buff.join("");
  };
  
  ret.toSd=function(){
      return ret.toMol() + "\n" + ret.getPropertiesSD()+ "\n$$$$";
  }
 
  
  ret.fromSmiles=function(smi){
    let smiles=smi.split(" ");
          let c= JSChemify.SmilesReader().parse(smiles[0],ret);
    if(smiles.length>1){
      c.setPathNotation(smiles[1]);
    }
    return c;
  };
  ret.toSmilesPP=function(){
    let smi=ret.toSmiles();
    if(ret.hasCoordinates()){
       let pth=ret.getShortPathNotation();
       return smi + " " + pth;
    }
    return smi;
  };
  ret.toSmiles=function(){
      if(ret.getAtomCount()==0)return "";
      var startAtom = ret.getAtom(0);
      var chain=[];
      var atomsGot=[];
      var takenLocants=[];
      var locantUsed=[];
      var getLowestLocant = (at)=>{
          for(var i=1;i<100;i++){
            if(!takenLocants[i]){
              if(locantUsed[i]>=0){
                if(at._idx<locantUsed[i])continue;
            }
              takenLocants[i]=true;
              return i;
          }
        }
      };
      for(var i=0;i<ret.getAtomCount();i++){
          atomsGot[i]=false;
      }
      while(startAtom){
        if(startAtom.getBondCount()<1){
                    chain.push({"atom":startAtom});
        }else{
          var closedRings=[];
          var startTime=true;
           var branchStarts=[];
           startAtom.$allPathsDepthFirst((p,type)=>{
           
             var prevAtom = p[p.length-2];
             var newAtom = p[p.length-1];
             if(startTime){
                 prevAtom._idx=chain.length;
                 chain.push(prevAtom);
                 startTime=false;
             }
             if(type==="BRANCH"){
               chain.push("BRANCH_START");
               branchStarts.push(chain.length-1);
             }
              
             if(closedRings.findIndex(cr=>cr.bond ===newAtom.bond)>=0){
                 return true;
             }
             if(type==="POP"){
               //This is a hack to fix a weird problem
               //that I don't understand. We need a better
               //fix
               if(branchStarts.length>0){
                 var pBranch=branchStarts.pop();
                 if(chain[chain.length-1]!=="BRANCH_START"){
                   chain.push("BRANCH_END:"+pBranch);
                 }else{
                   //the branch isn't real
                   chain.pop();
                 }
                 if(newAtom.locants){
                   newAtom.locants.map(ll=>{
                       takenLocants[ll]=false;
                   });
                 }
               }else{
               }
               
               return;
             }
            
             //RING
             var rindx=p.findIndex(pa=>pa.atom===newAtom.atom);
             if(rindx<p.length-1){
               if(!p[rindx].locants){
                 p[rindx].locants=[];
               }
               var loc=getLowestLocant(p[rindx]);
               p[rindx].locants.push(loc);
               newAtom.closeLocant=loc;
               locantUsed[loc]=chain.length;
               
               newAtom._idx=chain.length;
               chain.push(newAtom);
               closedRings.push(newAtom);
               return true;
             }else{
                 newAtom._idx=chain.length;
                 chain.push(newAtom);
             }
   
           },null,true,null,true);
           }
        /*
        for(var li=chain.length-1;li>=0;li--){
          var last = chain[li];
          if((last+"").startsWith("BRANCH_END")){
            var index=last.split(":")[1]-0;
            chain[index]="";
            chain[li]="";
          }else{
              break;
          }
        }*/
        chain.filter(cc=>cc.atom).map(ca=>atomsGot[ca.atom.getIndexInParent()]=true);
        
        var ni = atomsGot.findIndex(g=>!g);
        if(ni>=0){
            startAtom=ret.getAtom(ni);
          
            chain.push("NEW");
        }else{
            startAtom=null;
        }
      }
      
      let smi= chain.map(cc=>{
       
        if(cc==="BRANCH_START"){
            return "(";
        }else if((cc+"").startsWith("BRANCH_END")){
          return ")";
        }else if(cc==="NEW"){
          return ".";
        }else if(cc===""){
            return "";
        }
        var loc=(cc.locants)?cc.locants.map(lo=>(lo>9)?"%"+lo:lo).join(""):"";
        if(!cc.bond){
          return cc.atom.toSmiles()+loc;
        }
        var bb=cc.bond.toSmiles();
        if(bb===":"){
            var aro=cc.bond.getAtoms().map(at=>at.toSmiles()).join("");
          if(aro===aro.toLowerCase()){
              bb="";
          }
        }
        if(cc.closeLocant){
          var cloc = ((cc.closeLocant-0)>9)?("%"+cc.closeLocant):cc.closeLocant;
            return bb + cloc;
        }
        
        return bb + cc.atom.toSmiles()+loc;
      }).join("");

      return smi;
  
  };
  
  
  if(arg){
      if(arg.indexOf("M  END")>0){
        return ret.fromMol(arg);
    }else{
        //assume smiles
      return ret.fromSmiles(arg);
    }
  }
  return ret;
};
/*******************************
/* SGroup
/*******************************
Status: IN PROGRESS

A wrapper around the atoms, bonds
that might come in a group
   
*******************************/
JSChemify.SGroup=function(){
   let ret={};
   
   ret._chemType = JSChemify.CONSTANTS.CHEM_TYPE_SGROUP;
   ret._type=null;
   ret._index=null;
   ret._atoms=[];
   ret._crossBonds=null;
   ret._connectivity=null;
   ret._displayAtoms=null;
   ret._label=null;
   ret._bracket1=null;
   ret._bracket2=null;
   ret._parent=null;

   ret.getIndex=function(){
      return ret._index;
   };  
   ret.setIndex=function(s){
      ret._index=s;
      return ret;
   };
   ret.addAtom=function(a){
      ret._atoms.push(a);
      return ret;
   };
   ret.setAtoms=function(a){
      ret._atoms=a;
      return ret;
   };
   ret.setType=function(t){
      ret._type=t;
      return ret;
   }
   ret.getType=function(){
      return ret._type;
   };
   ret.getLabel=function(){
      return ret._label;
   };
   ret.setConnectivity=function(c){
      ret._connectivity=c;
      return ret;
   };
   ret.getConnectivity=function(){
      return ret._connectivity;
   };
   ret.setLabel=function(l){
      ret._label=l;
      return ret;
   };
   ret.setParent=function(c){
      ret._parent=c;
      return ret;
   };
   
   ret.getParent=function(){
      return ret._parent;
   };
   
   ret.getAtoms=function(){
         return ret._atoms;
   };
   ret.hasAtom=function(a){
         return ret.getAtoms().indexOf(a)>=0;
   };
   ret.hasBond=function(b){
         return ret.getBonds().indexOf(b)>=0;
   };
   ret.getBonds=function(){
      if(!ret.$bonds){
         ret.$bonds = JSChemify.Util.distinct(ret.getAtoms()
            .flatMap(a=>a.getBonds())
            .filter(a=>a.getAtoms().filter(aa=>ret.hasAtom(aa)).length==2));
      }
      return ret.$bonds;
   };
   ret.addBracketXY=function(pt1,pt2){
      if(!ret._bracket1){
         ret._bracket1=[pt1,pt2];
      }else if(!ret._bracket2){
         ret._bracket2=[pt1,pt2];
      }else{
         throw "Cannot specify 3rd bracket position for SGroup, 2 already specified";
      }
      return ret;
   };
   //for now, calculate based on contained atoms if not set explicitly
   
   ret.getCrossBonds=function(){
      if(!ret._crossBonds){
         ret._crossBonds=JSChemify.Util.distinct(ret.getAtoms()
            .flatMap(a=>a.getBonds())
            .filter(b=>!ret.hasBond(b)));
      }
      return ret._crossBonds;
   };
   ret.getDisplayAtoms=function(){
      if(!ret._displayAtoms){
         ret._displayAtoms=ret.getAtoms();
      }
      return ret._displayAtoms;
   };
   ret.addDisplayAtom=function(a){
      if(!ret._displayAtoms){
         ret._displayAtoms=[];
      }
      ret._displayAtoms.push(a);
      return ret;
   };
   ret.getBoundingBox=function(){
      return JSChemify.ShapeUtils()
                      .getBoundingBox(ret.getAtoms(),1);
   };
   ret.getCenterPoint=function(){
      if(!ret.$center){
         let bbox=ret.getBoundingBox();
         ret.$center=[(bbox[2]+bbox[0])/2,(bbox[3]+bbox[1])/2];
      }
      return ret.$center;
   };
   ret.resetBracketLocation=function(){
      ret._bracket1=null;
      ret._bracket2=null;
      
      return ret;
   };
   ret.getBracketLocation=function(){
      if(!ret._bracket1){
            var cbonds=ret.getCrossBonds();
            if(cbonds.length===2){

               //TODO: make bracket snap to a cardinal direction
               // probably?
               
               let b1=cbonds[0];
               let b2=cbonds[1];
               var c1=b1.getCenterPoint();
               var c2=b2.getCenterPoint();
               var d1=b1.getDeltaVector();
               var d2=b2.getDeltaVector();
               ret._bracket1=[[c1[0]-d1[1]/2,c1[1]+d1[0]/2],
                              [c1[0]+d1[1]/2,c1[1]-d1[0]/2]];
                              
               ret._bracket2=[[c2[0]+d2[1]/2,c2[1]-d2[0]/2],
                             [c2[0]-d2[1]/2,c2[1]+d2[0]/2]];
               if(c1[0]>c2[0]){
                  let t= ret._bracket1;
                  ret._bracket1=ret._bracket2;
                  ret._bracket2=t;
               }
               
            }else{
               let bbox=ret.getBoundingBox();
               ret._bracket1=[[bbox[0],bbox[1]],
                              [bbox[0],bbox[3]]];
               
               ret._bracket2=[[bbox[2],bbox[3]],
                             [bbox[2],bbox[1]]];
            }
      }
      return [ret._bracket1,ret._bracket2];
   };
   
   

   return ret;
};

/*******************************
/* RingBond
/*******************************
Status: WORKING

A wrapper around shared atoms and
bonds found between rings.

Analogous to a Bond
   
*******************************/
JSChemify.RingBond=function(){
    var ret={};
    ret._ring1=null;
    ret._ring2=null;
    ret._bonds=null;
    ret._batoms=null;
    ret.$bridgeHeads=null;
    
    ret.setRingBond=function(r1,r2,bds,batoms){
      ret._ring1=r1;
      ret._ring2=r2;
      ret._bonds=bds;
      ret._batoms=batoms;
      return ret;
    };
    
    ret.getAtoms=function(){
        return ret._batoms;
    };
    ret.getBonds=function(){
           return ret._bonds;
    };
    
    ret.getParent=function(){
        return ret._ring1.getParent();
    };
    
    
    ret.getRings=function(){
        return [ret._ring1,ret._ring2];
    };
    ret.getOtherRing=function(ringStart){
        if(ringStart===ret._ring1)return ret._ring2;
        if(ringStart===ret._ring2)return ret._ring1;
      return null;
    };
    ret.getBridgeHeads=function(){
        if(!ret.$bridgeHeads){
          if(ret.getAtoms().length<=2){
            ret.$bridgeHeads=ret.getAtoms();
        }else{
            var counts={};
          ret.getBonds()
             .flatMap(b=>b.getAtoms())
             .map(a=>{
                 var cc=counts[a.getIndexInParent()];
              if(!cc)cc=0;
              cc++;
              counts[a.getIndexInParent()]=cc;
             });    
          ret.$bridgeHeads=Object.keys(counts)
                .filter(k=>counts[k]==1)
                .map(k=>ret.getParent().getAtom(k));
        }
      }
      return ret.$bridgeHeads;
    };
    
    return ret;    
};

/*******************************
/* RingSystem
/*******************************
Status: WORKING

A wrapper around Rings and
RingBonds found between rings.

Analogous to a Chemical
   
*******************************/
JSChemify.RingSystem=function(arg, rbs){
      if(arg && arg._rings){
      return arg;
    }
    var ret={};
    ret._ringBonds=null;
    ret._rings=null;
    
    ret.$atoms=null;
    ret.$externalBonds=null;
    ret.$center=null;
    
    ret.toRingSystem=function(r, rbs){
      if(r&&r._rings)return r;
      return ret.setRingSystem(r, rbs);
    }
    ret.setRingSystem=function(r, rbs){
      if(r&&r._rings){
        ret._rings=r._rings.map(a=>a);
        ret._ringBonds=rbs;
      }else{
        ret._rings=r;
        ret._ringBonds=rbs;
      }
      return ret;
    };
    
    ret.getSize=function(){
        return ret.getAtoms().length;
    };
    
    
    ret.getAtoms=function(){
        if(!ret.$atoms){
          ret.$atoms=JSChemify.Util.distinct(ret.getRings()
                      .flatMap(r=>r.getAtoms()));
      }
      return ret.$atoms;
    };
    ret.getCenterPoint=function(){
      if(!ret.$center){
                var cpoint=ret.getRings().map(r=>r.getCenterPoint().map(a=>a))
                            .map(cp=>{
                    cp.push(1);
                    return cp;
                  })
                  .reduce(JSChemify.Util.addVector);
        cpoint[0]=cpoint[0]/cpoint[2];
        cpoint[1]=cpoint[1]/cpoint[2];
        cpoint.pop();
        ret.$center=cpoint;
           }
      return ret.$center;
    };
    ret.getRings=function(){
        
      return ret._rings;
    };
    ret.getRingBonds=function(){
        return ret._ringBonds;
    };
    
    ret.getExternalBonds=function(){
        if(!ret.$externalBonds){
          ret.$externalBonds=ret.getRings()
                                                  .flatMap(rr=>rr.getExternalBonds())
                                                    .filter(eb=>!eb.bond.isInRing());
      
      }
      return ret.$externalBonds;
    };
    ret.hasAtom=function(a){
        return ret.getAtoms().indexOf(a)>=0;
    };
    ret.hasRing=function(r){
        return ret.getRings().indexOf(r)>=0;
    };
    
    if(arg){
        return ret.setRingSystem(arg, rbs);
    }
    return ret;
};

/*******************************
/* Ring
/*******************************
Status: WORKING

A wrapper around ring atoms and bonds
to provide utility functions.
   
*******************************/
JSChemify.Ring=function(arg){
    if(arg && arg._ring){
      return arg;
  }
  var ret={};
  ret._ring=null;
  
  ret.$atoms=null;
  ret.$envelope=null;
  ret.$center=null;
  ret.$ringSystem=null;
  ret.$ringBonds=null;
  
  ret.toRing=function(r){
      if(r&&r._ring)return r;
    return ret.setRing(r);
  }
  ret.setRing=function(r){
      if(r&&r._ring){
        ret._ring=ret._ring.map(a=>a);
    }else{
        ret._ring=r;
    }
    return ret;
  };
  
  ret.isEnvelope=function(){
      if(ret.$envelope===null){
        var s=ret.getSize();
        ret.$envelope=(ret.getBonds()
                       .filter(b=>b.getSmallestRingSize()===s)
                       .length==0);
    }
    return ret.$envelope;
  };
  
  ret.getRingBond=function(r2){
      var cbs = ret.getConnectedBonds(r2);
    var cas = ret.getConnectedAtoms(r2);
    if(cbs.length>0){
        return JSChemify.RingBond()
                                       .setRingBond(ret,r2,cbs,cas);
    }else if(cas.length>0){
        return JSChemify.RingBond()
                                       .setRingBond(ret,r2,cbs,cas);
    }
    return null;
  };
  
  ret.getCenterPoint=function(){
    if(!ret.$center){
      var sumV=ret.getAtoms()
         .map(a=>[a.getX(),a.getY(),1])
         .reduce(JSChemify.Util.addVector);
      sumV[0]=sumV[0]/sumV[2];
      sumV[1]=sumV[1]/sumV[2];
      sumV.pop();
      ret.$center=sumV;
    }
    return ret.$center;
  };
  
  ret.getParent=function(){
      return ret._ring[0].getParent();
  };
  
  ret.getParentRingSystem=function(){
      if(!ret.$ringSystem){
        ret.$ringSystem=ret.getParent()
                         .getRingSystems()
                         .find(rs=>rs.hasRing(ret));
    }
    return ret.$ringSystem;
  };
  
  ret.getNeighborRingsAndBonds=function(){
      if(!ret.$ringBonds){
        ret.$ringBonds=ret.getParentRingSystem()
                                          .getRingBonds()
                        .map(rb=>({ring:rb.getOtherRing(ret),bond:rb}))
                        .filter(rbb=>rbb.ring);
    }
    return ret.$ringBonds;
  };
  
  
  ret.getConnectedBonds=function(rr){
      return rr.getBonds().filter(rb=>ret.hasBond(rb));
  };
  ret.getConnectedAtoms=function(rr){
      return rr.getAtoms().filter(ra=>ret.hasAtom(ra));
  };
  ret.getExternalBonds=function(){
      return ret.getAtoms().flatMap(a=>{
            return a.getNeighborAtomsAndBonds()
         .filter(ba=>ret._ring.indexOf(ba.bond)<0)
         .map(ba=>{
                 ba.atom=a;
            return ba;
         });
    });
  };
  ret.hasBond=function(bd){
      return ret.getBonds().indexOf(bd)>=0;
  };
  ret.hasAtom=function(at){
      return ret.getAtoms().indexOf(at)>=0;
  };
  ret.indexOf=function(at){
      return ret.getAtoms().indexOf(at);
  };
  ret.getAtoms=function(){
    if(ret.$atoms)return ret.$atoms;
    var atoms=[];
    var bds=ret.getBonds();
    var fbond = bds[0];
    var swap=false;
    var patoms=null;
    bds.map((b,j)=>{
        if(j==bds.length-1)return;
        if(patoms==null){
          atoms.push(b.getAtoms()[0]);
          atoms.push(b.getAtoms()[1]);
          patoms=[b.getAtoms()[0],b.getAtoms()[1]];
        }else{
          var atn;
          if(patoms.length===1){
               atn=patoms.map(a=>b.getOtherAtom(a))
                        .filter(at=>at!==null);
          }else{
               var oat=b.getOtherAtom(patoms[0]);
               if(oat){
                  swap=true;
                  atn=[oat];
               }else{
                  atn=[b.getOtherAtom(patoms[1])];
               }
          }
          
          atoms.push(atn[0]);
          patoms=atn;
        }
    });
    if(swap){
         var f=atoms[0];
         atoms[0]=atoms[1];
         atoms[1]=f;
    }
    ret.$atoms=atoms;
    return atoms;
  };
  ret.getBonds=function(){
      return ret._ring;
  };
  ret.getBondAt=function(bi){
      var ni=(bi+2*ret.getSize())%ret.getSize();
    return ret._ring[ni];
  }
  ret.dearomatize=function(){
    var s=ret.getSize();
    if(s%2===0 || s%2===1){
      var startOrder=1;
      var startIndex=0;
      
      var aset = ret.getBonds()
                    .map((b,i)=>[b,i])
                    .filter(bb=>bb[0].getBondOrder()!=4);
      
       
       
      if(aset.length>1){
          throw "can't dearomatize, there are " + aset.length + " presets";
      }
      
      if(aset.length===1){
          startOrder=aset[0][0].getBondOrder();
        startIndex=aset[0][1];
        ret.getBondAt(startIndex+1).setBondOrder(1);
        ret.getBondAt(startIndex-1).setBondOrder(1);
        startOrder=2;
        startIndex+=2;
      }
      ret.getExternalBonds()
         .filter(b=>!b.bond.isInRing())
         .filter(b=>b.bond.getBondOrder()==2)
         .map(b=>{
            b.atom.getBonds()
                  .filter(bb=>bb.getBondOrder()===4)
                  .filter(bb=>ret.hasBond(bb))
                  .map(bb=>{
                     bb.setBondOrder(1);
                     startOrder=2;
                  });
         });
       
      var hetero1=ret.getAtoms()
         .filter(a=>a.getSymbol()!=="C")
         .reduce((a,b)=>{
                 if(a===null)return b;
                 if(b===null)return a;
                 if(a.getBonds().length>b.getBonds().length){
                return a;
            }
            return b;
         },null) ;
         if(hetero1){
          if(s%2===1){
        hetero1.getBonds()
               .filter(b=>b.getBondOrder()===4)
               .map(b=>b.setBondOrder(1));
        startIndex=ret.getBonds().findIndex(b=>b.getOtherAtom(hetero1)!==null);   
        }
      }
         
         
      for(var i=0;i<s;i++){
        var b= ret.getBondAt(i+startIndex);
        if(b.getBondOrder()===4){
            b.setBondOrder(startOrder);
            startOrder=(startOrder)%2+1;
        }else{
            startOrder=(b.getBondOrder())%2+1;
        }
      }
    }
    return ret;
    
  };
  ret.isAromatic=function(){
      var s=ret.getSize();
      if(s>6||s<5)return false;
    if(s%2===0){
        for(var i=0;i<s;i++){
          var bo1=ret._ring[i].getBondOrder();
          var bo2=ret._ring[(i+1)%s].getBondOrder();
        if((bo1===1||bo1===2)&&(bo2===1||bo2===2)&&(bo1!==bo2)){
            //alternating is aromatic
        }else if(bo1===4 && bo2===4){
            //explicit aromatic is aromatic
        }else{
            if(bo1===1 && bo2===1 && 
               ret._ring[i].couldBeAromatic() && 
             ret._ring[(i+1)%s].couldBeAromatic()
          ){
              //SP2 chain is aromatic
          }else{
                  return false;    
          }
        }
      }
      return true;
    }
    if(s%2===1){
        for(var i=0;i<s;i++){
          var bo1=ret._ring[i].getBondOrder();
          var bo2=ret._ring[(i+1)%s].getBondOrder();
        if((bo1===1||bo1===2)&&(bo2===1||bo2===2)&&(bo1!==bo2)){
        
        }else if(bo1===4 && bo2===4){
            
        }else if(bo1===1 && bo2===1 && 
               ret._ring[i].couldBeAromatic() && 
             ret._ring[(i+1)%s].couldBeAromatic()
          ){
          //SP2 chain is aromatic
        }else if(bo1===1 && bo2===1){
        
            atoms1=ret._ring[i].getAtoms();
            atoms2=ret._ring[(i+1)%s].getAtoms();
          var shared=atoms2[0];
          if(atoms1.indexOf(shared)<0){
              shared=atoms2[1];
          }
          var sa=shared.getSymbol();
          if(sa==="N" || sa==="O" || sa==="S"){
          
          }else{
              return false;
          }
        }else{
            return false;
        }
      }
      return true;
    }
  };
  ret.canonicalize=function(){
      var lowest=ret._ring.map((b,i)=>[b.getIndexInParent(),i]).reduce((a,b)=>{
      if(a[0]<b[0])return a;
      return b;
    });
    var gi1=(lowest[1]+1)%ret._ring.length;
    var gi2=(lowest[1]-1+ret._ring.length)%ret._ring.length;
    var rev=true;
    if(ret._ring[gi1].getIndexInParent()<ret._ring[gi2].getIndexInParent()){
        rev=false;        
    }
    var nring=[];
    for(var j=0;j<ret._ring.length;j++){
        var nj=(rev)?((lowest[1]-j)+ret._ring.length):lowest[1]+j;
        var gi=nj%ret._ring.length;
      nring.push(ret._ring[gi]);
    }
      ret._ring=nring;
    return ret;
  };
  ret.toString=function(){
      return ret._ring.map(b=>b.getIndexInParent()+"").join(",");
  };
  ret.getSize=function(){
      return ret._ring.length;
  };
  if(arg){
      return ret.toRing(arg);
  }
  
  return ret;
};


JSChemify.ChemicalFeatures=function(){
   let ret={};
   ret._counts={};

   //TODO: think this through
   ret._atomCounts={};
   
   ret.$hash=function(s){
        let hash = 0, i, chr;
        if (s.length === 0) return hash;
        for (i = 0; i < s.length; i++) {
          chr = s.charCodeAt(i);
          hash = ((hash << 5) - hash) + chr;
          hash |= 0; // Convert to 32bit integer
        }
        return hash;
   };

   ret.addFeature=function(f,nc){
      if(!nc)nc=1;
      let c= ret._counts[f];
      if(!c)ret._counts[f]=0;
      ret._counts[f]+=nc;
      return ret;
   };
   
   ret.toFoldedFingerprint=function(size){
      let fp=[];
      if(!size){
         size=1024;
      }
      
      Object.keys(ret._counts)
            .map(k=>{
               let hnum=Math.abs(ret.$hash(k))%size;
               fp[hnum]=((!fp[hnum])?0:fp[hnum])+ret._counts[k];
            });
      //TODO: make it binary?
      return fp;
   };
   
   
   return ret;
};
/*******************************
/* ChemicalSearcher
/*******************************
Status: IN PROGRESS


   
*******************************/
JSChemify.ChemicalSearcher=function(){
   let ret={};
   ret._query=null;
   ret._queryBonds=null;
   ret._queryAtoms=null;
   ret._queryBondLeft=[];
   ret._queryBondRight=[];
   
   ret.setQuery=function(c){
      ret._query=JSChemify.Chemical(c);
      ret._queryBonds=ret._query.getBonds();
      ret._queryAtoms=ret._query.getAtoms();

      //make left and right bond neighbors index
      ret._queryBondLeft=ret._query.getBonds()
                .map(b=>{
                     let bns=b.getAtom1()
                             .getNeighborAtomsAndBonds()
                             .filter(bn=>bn.bond!==b)
                             .map(bn=>bn.bond.getIndexInParent());
                     return bns;
                });
      ret._queryBondRight=ret._query.getBonds()
                .map(b=>{
                     let bns=b.getAtom2()
                             .getNeighborAtomsAndBonds()
                             .filter(bn=>bn.bond!==b)
                             .map(bn=>bn.bond.getIndexInParent());
                     return bns;
                });
      
      
      return ret;
   };
   
   ret.sameBond=function(b1,b2){
      //TODO: make more flexible
      // for queries
      if(b1.getBondOrder() === b2.getBondOrder()){
         let dir=0;
         if(ret.sameAtom(b1.getAtom1(),b2.getAtom1() &&
            ret.sameAtom(b1.getAtom2(),b2.getAtom2()
                        ){
            dir=1;
         }
         if(ret.sameAtom(b1.getAtom2(),b2.getAtom1() &&
            ret.sameAtom(b1.getAtom1(),b2.getAtom2()
                        ){
            dir=dir+2;
         }
         //0 means no match
         //1 means only same way match
         //2 means only invert match
         //3 means both matches
         return dir;
      }
      return 0;
   };
   ret.sameAtom=function(a1,a2){
      //TODO: make more flexible
      // for queries
      if(a1.getSymbol() === a2.getSymbol() &&
         a1.getCharge() === a2.getCharge() &&
         a1.getIsotope() === a2.getIsotope() &&
        ){
         return true;
      }
      return false;
   };
   ret.match=function(t){
      let tar=JSChemify.Chemical(t);
      let q=ret._query;
      //target must have at least the same number
      //of atoms and bonds as query
      if(tar.getBonds().length<q.getBonds().length || 
         tar.getAtoms().length<q.getAtoms().length
        ){
         return null;
      }
      //TODO: what about isolated atoms?
      let cancel=false;
      let possibleBonds = q.getBonds().map((b,i)=>{
         if(cancel){
            return;
         }
         let pBonds= tar.getBonds()
                   .map(b2=>[b2,ret.sameBond(b2,b)])
                   .filter(bb=>bb[1]!==0);
         if(pBonds.length<=0){
            cancel=true;
         }
         return [i,pBonds];
      });
      if(cancel)return null;

      let targetBondLeft=tar.getBonds()
                .map(b=>{
                     let bns=b.getAtom1()
                             .getNeighborAtomsAndBonds()
                             .filter(bn=>bn.bond!==b)
                             .map(bn=>bn.bond.getIndexInParent());
                     return bns;
                });
      let targetBondRight=tar.getBonds()
                .map(b=>{
                     let bns=b.getAtom2()
                             .getNeighborAtomsAndBonds()
                             .filter(bn=>bn.bond!==b)
                             .map(bn=>bn.bond.getIndexInParent());
                     return bns;
                });
      
      //make a copy
      let lookup=possibleBonds.map(b=>b);
      
      possibleBonds.sort((a,b)=>{
         return a[1].length-b[1].length;
      });
      //Start with the bond that has the least possibilities
      //possibleBonds[0]
      let tbondPair=possibleBonds[0];
      let qBondStack=[];
      let tBondStack=[];
      let idxStack=[];
      while(true){
         let qBondIndex=tbondPair[0];
         
         //next, get the neighbor bonds for
         //the query. Then filter the possible
         //bonds for ones that are compatible
         //with that bond
         let idx=0;
         let tbondTry=tbondPair[1][idx];
         let forward=(tbondTry[1]===1 || tbondTry[1]===3);
         let reverse=(tbondTry[1]===2 || tbondTry[1]===3);
         
         //first, assert that tbondTry is the
         //same as qbond. Then, check that
         //assumption by looking at the first neighbor
         //bond of qbond, and seeing if there's a
         //neighbor bond of tbondTry that fits that
         //criteria
         let qBondLeft=ret._queryBondLeft[qBondIndex];
         let qBondRight=ret._queryBondRight[qBondIndex];
         
         let tBondLeft=ret._queryBondLeft[qBondIndex];
         let tBondRight=ret._queryBondRight[qBondIndex];
         if(qBondLeft.length
         
      }
      
      
      
   };
   


   return ret;
};

/*******************************
/* EState
/*******************************
Status: WORKING

Basic implementation of Kier-Hall
EState vector for electrotopological
similarity/modelling.

TODO: 
1. Create an interface for similar
   metrics?
   
*******************************/
JSChemify.EState=function(arg){
  if(arg && arg._vec){
      return arg;
  }
  var ret={};
  ret._vec=null;
  ret.toVector=function(v){
    if(v&&v._vec){
        return v;    
    }else{
        return ret.setVector(v);
    }
  };
  ret.setVector=function(v){
    if(v&&v._vec){
        ret._vec=JSON.parse(JSON.stringify(v._vec));
    }else{
        ret._vec=v;
    }
    return ret;
  };
  ret.getAtomTypes=function(){
    return Object.keys(ret._vec);
  };
  ret.getComponent=function(k){
    if((typeof ret._vec[k]=== "undefined")){
      return 0; //Is this right to do?
    }else{
      return ret._vec[k];
    }
  };
  ret.setComponent=function(k,v){
    ret._vec[k]=v;
    return ret;
  };
  ret.addToComponent=function(k,v){
    if((typeof ret._vec[k]=== "undefined")){
        ret._vec[k]=v;
    }else{
        ret._vec[k]+=v;
    }
    return ret;
  };
  ret.toEZVector=function(avgV,sigmaV){
    var _nVec={};
    avgV.getAtomTypes().map(k=>{
        var aa=avgV.getComponent(k);
        var sa=sigmaV.getComponent(k);
        _nVec[k]=(ret.getComponent(k)-aa)/sa;
      });
    return JSChemify.EState(_nVec);
  };
  ret.clone=function(){
    return JSChemify.EState().setVector(ret);
  };
  ret.addHere=function(v){
    v=JSChemify.EState(v);
    v.getAtomTypes().map(at=>{
        ret.addToComponent(at,v.getComponent(at));
    });
    return ret;
  };
  ret.distanceTo=function(v){
    v=JSChemify.EState(v);
    var at1=ret.getAtomTypes();
    var at2=v.getAtomTypes();
    var allKeys = {};
    at1.map(k=>allKeys[k]=1);
    at2.map(k=>allKeys[k]=1);
    var sqDist=0;
    Object.keys(allKeys).map(k=>{
        var dc=ret.getComponent(k)-v.getComponent(k);
      sqDist=sqDist+dc*dc;
    });
    return Math.sqrt(sqDist);
  };
  ret.l2=function(){
    var mag=0;
    ret.getAtomTypes().map(k=>{
        var cc=ret.getComponent(k);
        mag+=cc*cc;
    });
    return Math.sqrt(mag);
  };
  ret.cosineTo=function(v){
      v=JSChemify.EState(v);
    var at1=ret.getAtomTypes();
    var at2=v.getAtomTypes();
    var allKeys = {};
    at1.map(k=>allKeys[k]=1);
    at2.map(k=>allKeys[k]=1);
    var dotSum=0;
    Object.keys(allKeys).map(k=>{
        var dot=ret.getComponent(k)*v.getComponent(k);
      dotSum+=dot;
    });
    return dotSum/(ret.l2()*v.l2());
  };
   
  ret.serialize=function(){
    return ret._vec;
  };

  ret.toString=function(){
    return ret._vec.toString();
  };
  
  if(arg){
      return ret.toVector(arg);
  }
  
  return ret;
};


/*******************************
/* InChIReader
/*******************************
Status: **NOT WORKING**

Parses a given InChI string and provides
the chemical object.

Only the basic barebones are here. It
DOES NOT WORK.

TODO: 
1. Preliminary implementation
   
*******************************/
JSChemify.InChIReader=function(){
    var ret={};
  ret._input=null;
  ret._bonds=[];
  ret._atoms=[];
  
  //TODO implement InChI
  
  ret.setInput=function(s){
       ret._input=s;
    return ret;
  };
  
  ret.parseFormula=function(f){
    var regex=/([A-Z][a-z]{0,1})([0-9]*)/y;
    var all=[];
    var order=[];
    
    regex.lastIndex=0;
    while(regex.lastIndex<f.length){
      var m=regex.exec(f);
      if(m){
        var c=1;
        if(m[2]){
          c=m[2];
        }
        order.push({"symbol":m[1],"count":c});
        regex.lastIndex=regex.lastIndex+m[0].length;

        if(f[regex.lastIndex]==="."){
          all.push(order);
          order=[];
        }
      }else{
        throw "can't parse formula:" + f;
      }
    }
    all.push(order);
    return all;
  };
  ret.parseConnectivity=function(c){
    //this is the number
    var regex=/([0-9][0-9]*)/y;
    regex.lastIndex=1;
    var prevNum=-1;
    var stack=[];
    var all=[];
    var bonds=[];
    while(regex.lastIndex<f.length){
      var m=regex.exec(c);
      if(m){
          var num=m[0];
        if(prevNum>0){
            bonds.push([prevNum,num]);
          regex.lastIndex=regex.lastIndex+m[0].length;
                    var next=c[regex.lastIndex];
          if(next==="-"){
              prevNum=num;
            regex.lastIndex++;
          }else if(next==="("){
              stack.push(num);
            regex.lastIndex++;
          }else if(next===")"){
              prevNum=stack.pop();
            regex.lastIndex++;
          }else if(next===","){
              //don't update prev
            regex.lastIndex++;
          }else if(next===";"){
              all.push(bonds);
            bonds=[];
            regex.lastIndex++;
          }else{
              throw "can't parse, unexpected '"+ next+"'";
          }
        }else{
                prevNum=num;
        }
        
      }else{
          throw "can't parse connectivity layer ";
      }
      
    }
    all.push(bonds);
    
    
    return all;
  };
  
  ret.parse=function(s){
      if(s)ret.setInput(s);
    ret._input;
    //InChI=1S/C19H28O2/c1-18-9-7-13(20)11-12(18)3-4-14-15-5-6-17(21)19(15,2)10-8-16(14)18/h11,14-17,21H,3-10H2,1-2H3/t14-,15-,16-,17-,18-,19-/m0/s1
    var layers=ret._input.split("/");
    var version=layers[0];
    var form=layers[1];
    var connectivity=layers[2];
    var fixedhydrogens=layers[3];
    var relativeStereo=layers[4];
    
    
    var symbols=ret.parseFormula(form);
    var connections=ret.parseConnectivity(connectivity);
    //InChI=1S/C10H13N5O4/c11-8-5-9(13-2-12-8)15(3-14-5)10-7(18)6(17)4(1-16)19-10/h2-4,6-7,10,16-18H,1H2,(H2,11,12,13)/t4-,6-,7-,10-/m1/s1
    
  };
  
  ret.build=function(chemical){
          //TODO:Checks
      if(!chemical){
                chemical = JSChemify.Chemical();
      }
      //TODO Implement:
      return chemical;
  }
  return ret;
};

/*******************************
/* SmilesReader
/*******************************
Status: Working

Parses a given smiles string and provides
the chemical object.

TODO: 
1. Support E/Z
2. Improve performance with parsing
   by avoiding the substring calls
   
*******************************/
JSChemify.SmilesReader=function(){
  var ret={};
  ret._input=null;
  ret._head=0;
  ret._slice=null;
  ret._atoms=[];
  ret._bonds=[];
  ret._branchIndex=[];
  ret._locantIndex={};
  ret._locantBond={};
  ret._locantBondNumber={};
  ret._bondNumber=0;
  ret._bondOnDeck="!";
  ret._targetAtomIndex=null;
  
  ret.setInput=function(s){
       ret._input=s;
    ret._slice=s;
    return ret;
  };
  ret.setHead=function(i){
    ret._head=i;
    return ret;
  };
  ret.readNext=function(regex,pred){
    var match=regex.exec(ret._slice);
    if(match){
        if(pred && !pred(match))return null;
      ret._slice=ret._slice.substr(match[0].length);
      return match;
    };
    return null;
  };
  ret.getBondOnDeck=function(atom){
      if(ret._bondOnDeck!=="!")return ret._bondOnDeck;
      if(!atom)return "-";
      var oat=ret._atoms[ret._targetAtomIndex];
      if(oat.type==="a" && atom.type==="a"){
          return "a:";
      }
      return "-";
  };
  ret.addAtom=function(atom){
          if(ret._targetAtomIndex!==null){
          var bt=ret.getBondOnDeck(atom);
          ret._bonds.push({"type":bt,
        "atom1":ret._targetAtomIndex,
        "atom2":ret._atoms.length,
        "num":ret._bondNumber
        });
        
          ret._bondNumber++;
        ret._bondOnDeck="!"; //always reset to single
      }
      ret._atoms.push(atom);
      ret._targetAtomIndex=ret._atoms.length-1;
      return ret;
  };
  ret.startBranch=function(){
      ret._branchIndex.push(ret._targetAtomIndex); //location of branch
    
      return ret;
  };
  ret.endBranch=function(){
      ret._targetAtomIndex=ret._branchIndex.pop();//get rid of last one
      return ret;
  };
  ret.addBond=function(t){
      ret._bondOnDeck=t;
    return ret;
  };
  ret.addLocant=function(l){
    //it already exists, close the bond
      if(ret._locantIndex[l]>=0){
            var l1=ret._locantIndex[l];
        
        if(ret._locantBond[l]!=="!!"){
            ret._bondOnDeck=ret._locantBond[l];
            ret._locantBond[l]="!!";
        }
        var num = ret._locantBondNumber[l];
        var bt=ret.getBondOnDeck(ret._atoms[l1]);
        
        ret._bonds.push({"type":bt,
        "atom2":ret._targetAtomIndex,
        "atom1":l1,
        "num":num
        });
        ret._bondOnDeck="!";
        ret._locantIndex[l]=-1;
        ret._locantBond[l]="!!";
        return ret;a
    }else{
        //mark this locant for later
        ret._locantIndex[l]=ret._targetAtomIndex;
      ret._locantBondNumber[l]=ret._bondNumber;
      ret._bondNumber++;
      if(ret._bondOnDeck!="!"){
            ret._locantBond[l]=ret._bondOnDeck;
      }else{
            ret._locantBond[l]="!!";
      }
      ret._bondOnDeck="!";
    }
    return ret;
  };
  ret.startComponent=function(){
    ret._targetAtomIndex=null;
    ret._bondOnDeck="!";
    ret._branchIndex=[];
    ret._locantIndex={};
    
    return ret;
  };
  ret.addCloseLocant=function(l){
      if(ret._locantIndex[l-0]>=0){
        var l1=ret._locantIndex[l-0];
        if(ret._locantBond[l]!=="!!"){
            ret._bondOnDeck=ret._locantBond[l];
            ret._locantBond[l]="!!";
        }
        var num = ret._locantBondNumber[l];
        var bt=ret.getBondOnDeck(ret._atoms[l1]);
        ret._bonds.push({
        "type":bt,
        "atom2":ret._targetAtomIndex,
        "atom1":l1,
        "num":num
        });
        ret._bondOnDeck="!";
        ret._locantIndex[l-0]=-1;
        ret._locantBond[l]="!!";
        return ret;
    }else{
        //TODO:Not sure about this
        //throw "No locant by index '" + l + "'";
      
      //mark this locant for later
        ret._locantIndex[l]=ret._targetAtomIndex;
      ret._locantBondNumber[l]=ret._bondNumber;
      ret._bondNumber++;
        if(ret._bondOnDeck!="!"){
            ret._locantBond[l]=ret._bondOnDeck;
      }else{
            ret._locantBond[l]="!!";
      }
      ret._bondOnDeck="!";
    }
      return ret;
  };
  ret.build=function(chemical){
          //TODO:Checks
      if(!chemical){
                chemical = JSChemify.Chemical();
      }
      //
      
      //ret._bonds.sort((a,b)=>{
      //  return a.num-b.num;
      //});
      
      ret._atoms.map(at=>{
          var nat=chemical.addNewAtom(at.atom);
          if(at.charge && at.charge.length===1){
              nat.setCharge((at.charge+"1")-0);
          }else if(at.charge && at.charge.length>1){
              nat.setCharge((at.charge)-0);
          }
          if(at.isotope){
              var iso=(at.isotope)-0;
              nat.setIsotope(iso);
          }
          if(at.map){
              nat.setAtomMap(at.map.substr(1)-0);
          }
          
          if(at.stereo){
              if(at.stereo=="@"){
                  nat.setParity(1);
              }else if(at.stereo=="@@"){
                  nat.setParity(2);
              }
          }
          //Since H is implicit,
          //it is treated like last sub
          //unless we swap parity
          if(at.HCount==="H1" ||at.HCount==="H"){
              nat.swapParity();
          }
          //TODO: MOre things
      });
      var bdsToCheck={};
      var lastB=-1;
      
      ret._bonds.map((bd,i)=>{
               
           var nbd=chemical.addNewBond(bd.atom1,bd.atom2,1);
           if(bd.type=="-"){
                   nbd.setBondOrder(1);
           }else  if(bd.type=="="){
                   nbd.setBondOrder(2);
           }else  if(bd.type=="#"){
                   nbd.setBondOrder(3);
           }else  if(bd.type==":"){
                   nbd.setBondOrder(4);
           }else  if(bd.type=="~"){
                   nbd.setBondOrder(0);
           }else  if(bd.type=="a:"){
                   nbd.setBondOrder(4);
              bdsToCheck[i]=true;
           }
           if(lastB>(bd.num-1)){
               chemical.getAtom(bd.atom1).swapParity();
               //chemical.getAtom(bd.atom2).swapParity();
           }
           lastB=bd.num;
      });
      
      //clean-up
      Object.keys(bdsToCheck)
            .map(b=>chemical.getBonds()[b])
            .filter(b=>!b.isInRing())
            .map(b=>{
                //mark aromatic external bonds as single
                b.setBondOrder(1);
            });
      
      return chemical;
          
  };
  
  ret.parseAtom=function(){
      var m=ret.readNext(/^[A-Z][a-z]{0,1}/,(p)=>{
          try{
              var el=JSChemify.Util.getElementFromSymbol(p[0]);
            return (el.smiles)?true:false;
        }catch(e){
            return false;
        }
        return true;
      });
      if(m){
         return ret.addAtom({"atom":m[0]});
      }
      m=ret.readNext(/^[C|N|O|S|P|I|F]/);
      if(m){
        return ret.addAtom({"atom":m[0]});
      }
      m=ret.readNext(/^[c|n|o|s|p]/);
      if(m){
        return ret.addAtom({"atom":m[0].toUpperCase(),"type":"a"});
      }
      m=ret.readNext(/^\[([0-9]{0,3})([A-Z][a-z]{0,2})([@]{1,2})?(H[0-9]*)?([+|-]{1,}[0-9]*)?([:][0-9]{1,3})?\]/);
      if(m){
          if(m[5] && (m[5].startsWith("++") || m[5].startsWith("--"))){ 
                m[5]=m[5][0]+[...m[5]].map(d=>Math.abs((d+"1")-0)).reduce((a,b)=>a+b,0);
          }
          return ret.addAtom({"atom":m[2],
                              "isotope":m[1],
                              "stereo":m[3],
                              "HCount":m[4],
                              "charge":m[5],
                              "map":m[6]});
      }
      m=ret.readNext(/^\[([0-9]{0,3})([a-z]{1})([@]{1,2})?(H[0-9]*)?([+|-]{1,}[0-9]*)?([:][0-9]{1,3})?\]/);
      if(m){
          if(m[5] && (m[5].startsWith("++") || m[5].startsWith("--"))){
                m[5]=m[5][0]+[...m[5]].map(d=>Math.abs((d+"1")-0)).reduce((a,b)=>a+b,0);
        }
          return ret.addAtom({"atom":m[2].toUpperCase(),
        "isotope":m[1],
        "stereo":m[3],
        "HCount":m[4],
        "charge":m[5],
        "map":m[6],
        "type":"a"});
      }
      throw "parse error, unexpected atom format:" + ret._slice;
  }
  ret.parseLocants=function(){
          var got1=true;
          while(got1){
        got1=false;
        var m=ret.readNext(/^[%][0-9][0-9]/);
        if(m){
           ret.addLocant(m[0].substr(1));
           got1=true;
        }
        m=ret.readNext(/^[0-9]/);
        if(m){
           ret.addLocant(m[0]);
           got1=true;
        }
      }
      
      return ret;
  };
  ret.parseCloseLocants=function(){
      var got1=true;
      while(got1){
        got1=false;
        var m=ret.readNext(/^[%][0-9][0-9]/);
        if(m){
           ret.addCloseLocant(m[0].substr(1));
           got1=true;
        }
        m=ret.readNext(/^[0-9]/);
        if(m){
           ret.addCloseLocant(m[0]);
           got1=true;
        }
      }
      
      return ret;
  };
  ret.parseBond=function(){
      var m=ret.readNext(/^[-:=#~]/);
      if(m){
        ret.addBond(m[0]);
      }else{
        //ret.addBond("-");
      }
      return ret;
  };
  ret.parseBranchOrComponent=function(){
      var m=ret.readNext(/^\(/);
      if(m){
        ret.startBranch();
        ret.parseBond();
      }else{
          m=ret.readNext(/^\)/);
        if(m){
            ret.endBranch();
          ret.parseBranchOrComponent();
          ret.parseBond();
        }else{
          m=ret.readNext(/^\./);
           if(m){
              ret.startComponent();
           }else{
                    ret.parseBond();
           }
        }
      }
      return ret;
  };
  ret.isEnd=function(){
      return ret._slice.length==0;
  };
  ret.parse=function(smiles, chem){
      ret.setInput(smiles);
      while(!ret.isEnd()){
         
         if(ret.isEnd())break;
          //TODO: Handle E/Z
          ret.readNext(/^\\/);
          ret.readNext(/^\//);
          ret.parseAtom();
        
          //TODO: Handle E/Z
          ret.readNext(/^\\/);
          ret.readNext(/^\//);
          ret.parseBond();
          ret.parseLocants();
        
          //TODO: Handle E/Z
          ret.readNext(/^\\/);
          ret.readNext(/^\//);
         ret.parseBranchOrComponent();
         ret.parseCloseLocants();
         ret.parseBranchOrComponent();
         ret.parseCloseLocants();
         ret.parseBranchOrComponent();
      };
      return ret.build(chem);
  };
  
  return ret;
  
};

JSChemify.Global={

};

/*******************************
/* ChemicalCollection
/*******************************
Status: NOT FULLY IMPLEMENTED
   
   
*******************************/
JSChemify.ChemicalCollection=function(){
   const ret={};
   ret._chems=[];
   ret._properties={};
   ret._propertyOrder=[];
   ret._inputStandardizer=null;
   ret._filteredChems=[];
   ret._collectionID="jschemify-table-" +(new Date()-0);

   ret._refreshListener=()=>{};

   ret.getCollectionID=function(){
      return ret._collectionID;
   };
   ret.getChemicalCount=function(){
      return ret._chems.length;
   };

   ret.addChemical=function(c){
      c=JSChemify.Chemical(c);
      if(ret._inputStandardizer){
         c=ret._inputStandardizer(c);
      }
      c.getPropertyKeys().map(k=>{
        var old=ret._properties[k];
        if(!old){
           old={count:0, order:ret._propertyOrder.length};
           ret._propertyOrder.push(k);
           ret._properties[k]=old;
        }
        //TODO:some stats
        old.count++;
      });
      c.setProperty("$index",ret._chems.length);
      ret._chems.push(c);
      return ret;
   };

   ret.$getCSS=function(){
      return `<style id="jschemify-table-style">
      .jschemify-tbl-image{
         max-width:150px;
      }
      .jschemify-tbl td {
          border-bottom: 1px solid #dedede;
      }
      .jschemify-tbl th {
          border-top: 1px solid grey;
          border-bottom: 1px solid grey;
          padding: 10px;
      }
      </style>`;
   };
   ret.$getHeaderHTML=function(){
        var headHTML = "<thead><tr><th>Structure</th><th>Name</th>"
               + ret._propertyOrder.map(p=>"<th>" + p + "</th>").join("") 
                  + "</tr></thead>";
        return headHTML;
   };
   ret.$getRowHTML=function(ri){
        var chem=ret.getChemical(ri);
        if(!chem.hasCoordinates()){
           try{
              chem.generateCoordinates();
           }catch(e){
              console.log(e);
              console.log(chem.toSmiles());
           }
        }
        var cchem=chem;
        try{
           cchem=chem.clone().dearomatize();  
        }catch(e){
           console.log(e);
           console.log(chem.toSmiles());
           
        }
        var rowHTML = "<tr><td><div class='jschemify-tbl-image'>" + cchem.getSVG() + "</div><div class='jschemify-tbl-smiles'>" 
               + cchem.toSmiles() +"</div></td><td>" + chem.getName() + "</td>"
               + ret._propertyOrder.map(p=>"<td>" + chem.getProperty(p) + "</td>").join("") 
                  + "</tr>";
        return rowHTML;
   };
   ret.$getTableHTML=function(maxRows){
         if(!maxRows)maxRows=10;
         maxRows=Math.min(maxRows,ret.getChemicalCount());
         JSChemify.Global[ret.getCollectionID()]=ret;
               
         let topPart=`<div id="` + ret._collectionID + `">
         <div class="jschemify-table-controls">
         <div style="display:none;" id="jschemify-raw-panel">
            <button id="jschemify-show-table">Show Table</button>
            <textarea id="jschemify-raw"></textarea>
         </div>
         <div id="js-full-table-view">
         Show Structures
         <select id="jschemify-structure-type">
         <option>Smiles+Structure</option>
         <option>Smiles Only</option>
         <option>Structure Only</option>
         </select>
         <input style="display:none;" id="mfile" type="file">
         <button id="jschemify-edit">Edit Raw Data</button>
         <button id="jschemify-import">Import</button>
         <button id="jschemify-download-sdf">Download SDF</button>
         <button id="jschemify-download-txt">Download TXT</button>
         
         <div style="display:none;">
         Structure Size
         <input id="jschemify-structure-size" type="range" min="1" max="100" value="50">
         </div>

         
         <div>
         <span>
         Display Rows
         <select id="jschemify-rows-per-page">
         <option>10</option>
         <option>20</option>
         <option>50</option>
         <option>All</option>
         </select>
         Showing <span id="jschemify-display-count">1-10</span> of <span id="total">` + ret.getChemicalCount() + `</span>
         <button id="jschemify-page-previous" disabled="">previous</button>
         <button id="jschemify-page-next">next</button></span>
         
         </div>
         
         <div class="jschemify-table-query">
         Query Smiles
         <input id="jschemify-query" value="CCCCCC">
         <select id="jschemify-query-type">
         <option>E-State</option>
         </select>
         <select id="jschemify-query-estate-metric">
         <option>Euclidean Distance</option>
         <option>Cosine Distance</option>
         </select>
         <button id="jschemify-query-search">Search</button>
         <div id="jschemify-query-img" class="jschemify-tbl-image">
         </div>
         </div>
         `;
           
        let htmlSections = [];
            
        htmlSections.push(topPart);
        htmlSections.push(ret.$getCSS());
        htmlSections.push("<table class='jschemify-tbl'>");
        htmlSections.push(ret.$getHeaderHTML());
        htmlSections.push("<tbody>");
        for(let i=0;i<maxRows;i++){
          htmlSections.push(ret.$getRowHTML(i));
        }
        htmlSections.push("</tbody>");
        htmlSections.push("</table>");
        htmlSections.push("</div>");
       
        setTimeout(()=>{
           ret.$registerEvents();
        },100);    
        return htmlSections.join("\n");
   };

   ret.clear=function(){
      ret._chems=[];
      ret._properties={};
      ret._propertyOrder=[];
      return ret;
   };

   ret.refresh=function(){
      ret._refreshListener();
   };
   ret.$registerEvents=function(){
       let top=10;
       let skip=0;
       let download=function(blob, name = 'file.txt'){
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = name;
        document.body.appendChild(link);
        link.dispatchEvent(
          new MouseEvent('click', { 
            bubbles: true, 
            cancelable: true, 
            view: window 
          })
        );
        document.body.removeChild(link);
      };
      
      let parent=document.querySelector("#" + ret.getCollectionID());
      let $=(t)=>parent.querySelector(t);
      let $$=(t)=>parent.querySelectorAll(t);
      let pageCountElm=$("#jschemify-display-count");
      let previousPageElm=$("#jschemify-page-previous");
      let nextPageElm=$("#jschemify-page-next");
      let selectCountElm=$("#jschemify-rows-per-page");
      let editRawElm=$("#jschemify-edit");
      $("#mfile").onchange=(e)=>{
           $("#mfile").style="display:none;"; 
           let file = e.target.files[0];
           if (!file) {
             return;
           }
           var reader = new FileReader();
           reader.onload =(ee)=>{
             let contents = ee.target.result;
             ret.clear();
             ret.fromFile(contents);
             ret.refresh();
           };
           reader.readAsText(file);
      };
      $("#jschemify-import").onclick=()=>{
         $("#mfile").style="";
         $("#mfile").click();
      };
      
      let update;
      let sorted="";
      let sortDir="";
      
      let refreshTable=()=>{
         let otab=$(".jschemify-tbl");
         let htmlSections=[];
         htmlSections.push(ret.$getHeaderHTML());
         htmlSections.push("<tbody>");
         for(let i=skip;i<Math.min(ret.getChemicalCount(),skip+top);i++){
           htmlSections.push(ret.$getRowHTML(i));
         }
         
         htmlSections.push("</tbody>");
         otab.innerHTML=htmlSections.join("\n");
         $("#total").innerHTML=ret.getChemicalCount();
         update();
         $$("th").forEach(hhh=>{
            let column=hhh.innerHTML;
            if(column===sorted){
               hhh.innerHTML=sortDir+sorted;
            }
         });
         $("#jschemify-structure-type").onchange();
      };
      ret._refreshListener=refreshTable;
      let tt= ()=>{
         $$("th").forEach(h=>{
            h.style="cursor:pointer;"
            h.onclick=()=>{
               let rev=-1;
               let column=h.innerHTML.replace('↑',"")
                                     .replace('↓',"");
               sorted=column;
               if(h.innerHTML.indexOf("↑")>=0){
                  rev=1;
                  sortDir="↓";
               }else if(h.innerHTML.indexOf("↓")>=0){
                  sortDir="";
                  rev=null;
               }else{
                  sortDir="↑";
               }
               if(rev===null){
                  rev=1;
                  column="$index";
               }
               ret._chems.sort((a,b)=>{
                 
                  let pA=a.getProperty(column);
                  let pB=b.getProperty(column);
                  
                  if(column.toLowerCase()==="name"){
                     pA=a.getName();
                     pB=b.getName();
                  }else if(column.toLowerCase()==="structure"){
                     pA=a.getMolWeight();
                     pB=b.getMolWeight();
                  }
                  var diff = pA-pB;
                  if(!isNaN(diff)){
                     return rev*diff;
                  }else if(Math.abs(pA)>=0){
                     return rev;
                  }else if(Math.abs(pB)>=0){
                     return -rev;
                  }
                  let m=[pA,pB].sort()[0];
                  if(m===pA){
                     return rev;
                  }else{
                     return -rev;
                  }
               });
               refreshTable();
               
            };
         });
      };
      update=tt;
      tt();
      let updateTopSkip=(t,s)=>{
            top=t;
            skip=Math.max(s,0);
            if(top+skip>=ret.getChemicalCount()){
                  nextPageElm.disabled=true;
            }else{
                  nextPageElm.disabled=false;
            }
            if(skip===0){
                   previousPageElm.disabled=true;
            }else{
                   previousPageElm.disabled=false;
            }
            pageCountElm.innerHTML=(skip+1)+ "-" + Math.min((skip+top),ret.getChemicalCount());
            let mh=[];
            for(let i=skip;i<Math.min(skip+top,ret.getChemicalCount());i++){
                mh.push(ret.$getRowHTML(i));
            }
            $("tbody").innerHTML=mh.join("\n");
            $("#jschemify-structure-type").onchange();
      };
      $("#jschemify-show-table").onclick=()=>{
            $("#js-full-table-view").style="";
            $("#jschemify-raw-panel").style="display:none;";
            ret.clear();
            let inp=$("#jschemify-raw").value.trim();
            ret.fromSmilesFile(inp);
            refreshTable();
         //TODO: refresh table
      };
      $("#jschemify-structure-type").onchange=()=>{
            let v=$("#jschemify-structure-type").value;
            if(v==="Smiles+Structure"){
               $$(".jschemify-tbl-image").forEach(e=>e.style="");
               $$(".jschemify-tbl-smiles").forEach(e=>e.style="");
            }else if(v==="Smiles Only"){
               $$(".jschemify-tbl-image").forEach(e=>e.style="display:none;");
               $$(".jschemify-tbl-smiles").forEach(e=>e.style="");
            }else if(v==="Structure Only"){
               $$(".jschemify-tbl-image").forEach(e=>e.style="");
               $$(".jschemify-tbl-smiles").forEach(e=>e.style="display:none;");
            }
      };
      $("#jschemify-query-search").onclick=()=>{
         let smi=$("#jschemify-query").value;
         let type=$("#jschemify-query-estate-metric").value;
         
         let cq=JSChemify.Chemical(smi).aromatize();
         let estate=cq.getEStateVector();

         ret.computeNewProperty("Distance",(cc)=>{
            let tar=cc.getEStateVector();
            if(type==="Cosine Distance"){
               return (1-tar.cosineTo(estate));
            }else{
               return tar.distanceTo(estate);
            }
            
         });
         ret._chems.sort((a,b)=>{
            return (a.getProperty("Distance")-0)- (b.getProperty("Distance")-0);
         });
         $("#jschemify-query-img").innerHTML=cq.dearomatize().getSVG();
         refreshTable();
      };
      editRawElm.onclick=()=>{
            $("#js-full-table-view").style="display:none;";
            $("#jschemify-raw-panel").style="";
            $("#jschemify-raw").value=ret.toSmilesFile();
      };
      selectCountElm.onchange=()=>{
         let t=selectCountElm.value;
         if(t.toLowerCase()==="all"){
            updateTopSkip(ret.getChemicalCount(),0);
         }else{
            updateTopSkip(t-0,skip);
         }
      };
      $("#jschemify-download-sdf").onclick=()=>{
         download(new Blob([ret.toSDF()]),"jschemify.sdf");
      };
      $("#jschemify-download-txt").onclick=()=>{
         download(new Blob([ret.toSmilesFile()]),"jschemify.txt");
      };
      $("#jschemify-page-next").onclick=()=>{
         updateTopSkip(top,skip+top);
      };
      $("#jschemify-page-previous").onclick=()=>{
         updateTopSkip(top,skip-top);
      };
      //jschemify-page-next
      
      
   };
   ret.getChemical=function(i){
     return ret._chems[i];
   };
   ret.getChems=function(){
      return ret._chems;
   };
   
   ret.setInputStandardizer=function(s){
      ret._inputStandardizer=s;
      return ret;
   };
   ret.fromSD=function(inputList){
      if(!Array.isArray(inputList)){
         inputList=inputList.split("\n");
      }
      let cursor=0;
      while(cursor<inputList.length){
         let parsed=null;

         try{
            parsed = JSChemify.Chemical()
                             .readNextMol(inputList,cursor);
            ret.addChemical(parsed.chem);
            cursor=parsed.cursor;
         }catch(e){
            console.log(e);
            if(cursor>inputList.length-3){
               console.log("End of file");
               break;
            }else{
               throw e;
            }
         }
        
      }
      return ret;
   };
   ret.fromFile=function(inputList){
       if(!Array.isArray(inputList)){
         inputList=inputList.split("\n");
       }
       let hasMend=false;
       for(let i=0;i<Math.min(2100,inputList.length);i++){
         let line=inputList[i];
         if(line.startsWith("M  END")){
            hasMend=true;
            break;
         }
       }
       if(hasMend){
          return ret.fromSD(inputList);
       }
       return ret.fromSmilesFile(inputList);
   };
   ret.fromSmilesFile=function(inputList){
       if(!Array.isArray(inputList)){
         inputList=inputList.split("\n");
       }
       let header=null;
       let headerIndex={};
       inputList
        .map(l=>l.split("\t"))
        .map((l,i)=>{
          //Header line
          if(i==0){
           header=l;
            header.map((v,i)=>headerIndex[v.toLowerCase()]=i);
            return null;
          }
          var name=i;
          var smiles=l[0];
          var pnot=null;
          if(headerIndex["name"]>=0){
            name=l[headerIndex["name"]];
          }
          if(headerIndex["smiles"]>=0){
            smiles=l[headerIndex["smiles"]];
          }
          if(headerIndex["path_notation"]>=0){
            pnot=l[headerIndex["path_notation"]];
          }
          var chem= JSChemify.Chemical().fromSmiles(smiles).setName(name);
          if(pnot){
            chem.setPathNotation(pnot);
          }
          
           
          for(var i=0;i<header.length;i++){
            if(header[i].toLowerCase()==="smiles" || header[i].toLowerCase()==="name" || header[i].toLowerCase() === "path_notation")continue;
            chem.setProperty(header[i],l[i]);
          }
          ret.addChemical(chem);
          return chem;
        })
        .filter(f=>f!=null);
      
      return ret;
   };
   ret.computeNewProperty=function(prop, calc){
      let t=0;
      ret.getChems().map(c=>{
         t++;
         c.setProperty(prop,calc(c));
      });
      if(!ret._properties[prop]){
         ret._propertyOrder.push(prop);
      }
      ret._properties[prop]=t;
      return ret;
   };
   ret.removeProperty=function(prop){
      ret.getChems().map(cc=>{
         cc.removeProperty(prop);
      });
      delete ret._properties[prop];
      ret._propertyOrder=ret._propertyOrder.filter(pp=>pp!==prop);
      return ret;
   };
   ret.toSmilesFileBuilder=function(){
      let builder={};
      builder._smilesPP=false;
      builder._pathNotationColumn=true;
      builder._generateCoordinates=false;
      
      builder._map=null;
      builder.smilesPP=function(b){
         if(b===false){
            builder._smilesPP=false;
         }else{
            builder._smilesPP=true;
         }
         return builder;
      };
      builder.addPathNotationColumn=function(b){
         if(b===false){
            builder._pathNotationColumn=false;
         }else{
            builder._pathNotationColumn=true;
         }
         return builder;
      };
      builder.generateCoordinates=function(b){
         if(typeof b === "undefined"){
            b=true;
         }
         builder._generateCoordinates=b;
         return builder;
      };
      builder.map=function(m){
         if(m){
            if(builder._map){
               let omap=builder._map;
               builder._map=((c)=>m(omap(c)));
            }else{
               builder._map=m;
            }
         }
         return builder;
      };
      builder.build=function(){
         
         var chems= ret.getChems();
         if(builder._map){
            chems=chems.map(builder._map);
         }
         var headerProps=ret._propertyOrder
                                        .map(po=>{
                                             if(po.toLowerCase()==="smiles"){
                                                return "verbatim_" + po;
                                             }
                                             return po;
                                        })
                                        .join("\t");
         //TODO: need to think about computed properties
         var header="SMILES\tName\t"+headerProps;
         if(builder._pathNotationColumn){
            header="SMILES\tPATH_NOTATION\tName\t"+headerProps;
         }
         let smiMaker=(c)=>{
            if(builder._smilesPP){
               return c.toSmilesPP();
            }else{
               return c.toSmiles();
            }
         };
         let pathNotationMaker=(c)=>{
            if(c.hasCoordinates()){
               return c.getShortPathNotation();
            }else{
               return "";
            }
         };
         
         return header + "\n" + chems.map(c=>{
            if(builder._generateCoordinates){
                if(!c.hasCoordinates()){
                    c.generateCoordinates();
                }
            }
            if(builder._pathNotationColumn){
               return smiMaker(c) + "\t" + pathNotationMaker(c) +"\t"+ c.getName()+"\t" + c.getProperties(ret._propertyOrder).join("\t");
            }else{
               return smiMaker(c) + "\t" + c.getName()+"\t" + c.getProperties(ret._propertyOrder).join("\t");
            }
         }).join("\n");
      };
      return builder;
   };
   ret.toSDFBuilder=function(){
      let builder={};
      builder._generateCoordinates=false;
      builder._map=null;
      builder.map=function(m){
         if(m){
            if(builder._map){
               let omap=builder._map;
               builder._map=((c)=>m(omap(c)));
            }else{
               builder._map=m;
            }
         }
         return builder;
      };
      builder.generateCoordinates=function(b){
         if(typeof b === "undefined"){
            b=true;
         }
         builder._generateCoordinates=b;
         return builder;
      };
      builder.build=function(){
         var chems= ret.getChems();
         if(builder._map){
            chems=chems.map(builder._map);
         }
         return chems.map(c=>{
            if(builder._generateCoordinates){
                if(!c.hasCoordinates()){
                    c.generateCoordinates();
                }
            }
            return c.toSd();
         }).join("\n");
      };
      return builder;
   };
   ret.toSDF=function(){
      return ret.toSDFBuilder()
                .generateCoordinates()
                .build();
   };
   ret.toSmilesFile=function(){
      return ret.toSmilesFileBuilder()
                .build();
   };
   
   ret.search=function(q){
      //TODO
   };
   
   

   return ret;
};

/*******************************
/* SVGContext
/*******************************
Status: Working

Emulates a 2D context for a canvas
so that we can make an SVG directly

TODO: 
1. Compress with
   1.1. CSS
   1.2. Consolidated paths
   1.3. [done] Rounded floats
   
   
*******************************/
JSChemify.SVGContext=function(width, height){
   let ret={};
   ret._width=width;
   ret._height=height;
   ret._components=[];
   ret._path=[];
   ret._cursor=["M",0,0];
   ret._closed=false;
   ret._lineDash=null;

   ret.lineWidth=1;
   ret.font = "8pt sans-serif";
   ret.fillStyle = "black";
   ret.strokeStyle = "black";
   
   ret.measureText=function(v){
      //Hacky
      var size= (/[0-9]*/y.exec(ret.font.trim())[0])-0;
      return {width:(size)*10.8/15};
   };

   ret.setLineDash=function(dpat){
      ret._lineDash=dpat;
      return ret;
   };
   
   ret.beginPath=function(){
      //TODO: what do we do here?
      ret._path=[];
      ret._closed=false;
      return ret;
   };
   ret.closePath=function(){
      ret._closed=true;
      return ret;
   };
   ret.moveTo=function(x,y){
      //I think it should just make a new
      //path?
      ret._cursor=[x,y];
      ret._path.push(["M",x,y]);
      return ret;
   };
   ret.lineTo=function(x,y){
      let line=["L",x,y];
      ret._cursor=[x,y];
      ret._path.push(line);
      return ret;
   };
   ret.stroke=function(){
      //<path d="M150 0 L75 200 L225 200 Z" style="fill:none;stroke:green;stroke-width:3" />
      var p = ret._path.map(pp=>pp.map(f=>{
        if(typeof f === "number" && Math.round(f)!==f){
          return f.toFixed(2);
        }
        return f;
      }).join(" ")).join(" ");
      if(ret._closed){
         p+=" Z";
      }
      let other="";
      if(ret._lineDash && ret._lineDash.length>0){
            other="stroke-dasharray=\"" + ret._lineDash.join(",") + "\" ";
      }
         //stroke-dasharray="10,10"
      p="<path " + other +  " d=\"" + p + "\" style=\"fill:none;stroke:" + ret.strokeStyle +
            ";stroke-width:" + ret.lineWidth + "\" />";
          
      ret._components.push(p);
      return ret;
   };
   ret.arc=function(cx,cy,rad,startAng,endAng){
      //ret.fillStyle="red";
      //
      //        ctx.arc(loc[0], loc[1], cleareRad, 0, 2 * Math.PI);
      cx=cx-rad*0.7;
      cy=cy-rad*0.7;
      ret.moveTo(cx,cy);
      //A 100 100 0 1 0 100 122
      var nudge=rad/1000;
      ret._path.push(["A", rad,rad,0,1,0,cx+nudge,cy-nudge, "Z"]);
      return ret;
   };
   
   ret.fill=function(){
      //<path d="M150 0 L75 200 L225 200 Z" style="fill:none;stroke:green;stroke-width:3" />
      var p = ret._path.map(pp=>pp.map(f=>{
        if(typeof f === "number" && Math.round(f)!==f){
          return f.toFixed(2);
        }
        return f;
      }).join(" ")).join(" ");
      if(ret._closed){
         p+=" Z";
      }
      p="<path d=\"" + p + "\" style=\"fill:" + ret.fillStyle + ";stroke:none\" />";
          
      ret._components.push(p);
      return ret;
   };
   ret.fillText=function(txt,x,y){
      var pelm = '<text x="' + x + '" y="' + y + '" style="font: ' + ret.font +';fill: ' +ret.fillStyle + ';">' + txt + '</text>';
      ret._components.push(pelm);
      return ret;
   };
   ret.toSVG=function(){
      var insert=ret._components.join("\n");
      return `<svg viewbox="0 0 ` + ret._width + ` `+ ret._height +`" xmlns="http://www.w3.org/2000/svg">` 
         + insert
         +`</svg>`;
   };
/*
<svg height="200" width="300" xmlns="http://www.w3.org/2000/svg">
  <line x1="0" y1="0" x2="300" y2="200" style="stroke:red;stroke-width:2" />
  <polygon points="100,10 150,190 50,190" style="fill:lime;stroke:purple;stroke-width:3" />
</svg>
*/
   return ret;
};

/*******************************
/* Renderer
/*******************************
Status: Working

Renders a chemical onto a context/canvas
based on certain parameters.

TODO: 
1. Highlight support
2. Fix sizing issue
3. Improve how you can modify
   the display settings
   
*******************************/
JSChemify.Renderer=function(){
  var ret={};
  
  ret._labelSize=0.50;
  ret._cleareRad=1.9;
  ret._dblWidth=0.15;
  ret._dblShort=1/6;
  ret._letterSpace=0.4;
  ret._lineWidth=1/35;
  ret._ang=Math.PI/24;
  ret._swid=0.02;
  ret._dcount=6;
  ret._dashSpace=1/8;
  ret._showAtomMapNumbers=true;
  ret._bracketWidth=0.3;

  
  ret._colorScheme={symbols:{}};
    /*
  ret._colorScheme={
  "symbols":{
    "C":"black",
    "O":"red",
    "N":"blue",
    "S":"yellow",
  }
  };
  */
  ret.$dash=null;
  ret.$wedge=null;
  
  
  ret._getWedge=function(){
      if(!ret.$wedge){
        ret.$wedge=[[0,-ret._swid],
                          [0,ret._swid],
              [Math.cos(ret._ang),Math.sin(ret._ang)],
              [Math.cos(-ret._ang),Math.sin(-ret._ang)],
              ];
    }
    return ret.$wedge;
  };
  ret._getDash=function(){
      if(!ret.$dash){
        ret.$dash=[];
      var cos=Math.cos(ret._ang);
      var sin=Math.sin(ret._ang);
      
      for(var i=0;i<=ret._dcount;i++){
          var rat=i/ret._dcount;
          var max=rat*(sin-ret._swid)+ret._swid;
          var xp=rat*(cos);
          ret.$dash.push([[xp,-max],[xp,max]]);
      }
    }
    return ret.$dash;
  };
  ret.getImageDimensions=function(chem,maxWidth,maxHeight){
     chem=JSChemify.Chemical(chem);
     if(!chem.hasCoordinates()){
         chem.generateCoordinates();
     }
     let scale=30; //average bond width in pixels
     var pad=10;
     const bbox=chem.getBoundingBox();
     //make room for some letters and 
     //stuff
     //TODO: improve this
     bbox[0]=bbox[0]-1;
     bbox[1]=bbox[1]-1;
     bbox[2]=bbox[2]+1;
     bbox[3]=bbox[3]+1;
     var cheight=bbox[3]-bbox[1];
     var cwidth=bbox[2]-bbox[0];
       
     var nwidth=cwidth*scale;
     var nheight=cheight*scale;
     
     if(!maxWidth){
        maxWidth=Math.ceil(nwidth+pad*2);
     }
     
     if(!maxHeight){
        maxHeight=Math.ceil(nheight+pad*2);
     }
     //rescale to fit
     if(nwidth>(maxWidth-pad*2) || nheight>(maxHeight-pad*2)){
         scale=Math.min((maxWidth-pad*2)/cwidth,(maxHeight-pad*2)/cheight);
     }
     var nret={chem:chem, scale:scale, maxWidth:maxWidth, maxHeight:maxHeight, pad:pad, bbox:bbox};
     return nret;
  };
  /**
     Create a promise of the BAS64 PNG data URL useful for a src tag. Accepts
     a chemical object, a smiles, a molfile etc. Will generate coordinates
     if none are present.
     
     example usage:
     JSChemify.Renderer()
              .getPNGPromise(JSChemify.Chemical("COc1ccccc1OCCNCC(O)COc1cccc2[nH]c3ccccc3c12")
                             ,150,150).then(u=>{
                             document.getElementById("myImg").src=u;
                             });
  **/ 
  ret.getPNGPromise = function(chem, maxWidth, maxHeight){
     
     const toDataURL = (data) =>
        new Promise(ok => {
          const reader = new FileReader();
          reader.addEventListener('load', () => ok(reader.result));
          reader.readAsDataURL(data);
        });
     let imgDim=ret.getImageDimensions(chem,maxWidth,maxHeight);
     
     const offscreen = new OffscreenCanvas(imgDim.maxWidth, imgDim.maxHeight);
     const ctx=offscreen.getContext("2d");
     ret.render(imgDim.chem,ctx,imgDim.pad,imgDim.pad,imgDim.scale);
     const blob = offscreen.convertToBlob();
     return (new Promise(ok=>{
        blob.then(b=>{
           toDataURL(b).then(u=>ok(u));
        });
     }));
  };
  ret.getSVGPromise = function(chem, maxWidth, maxHeight){
     return (new Promise(ok=>{
        ok(ret.getSVG(chem,maxWidth,maxHeight));
     }));
  };
  ret.getSVG = function(chem, maxWidth, maxHeight){
     //just in case it's not a chemical yet
     let imgDim=ret.getImageDimensions(chem,maxWidth,maxHeight);
     
     
     const ctx = JSChemify.SVGContext(imgDim.maxWidth, imgDim.maxHeight);
     ret.render(imgDim.chem,ctx,imgDim.pad,imgDim.pad,imgDim.scale);
     return ctx.toSVG();
  };

  ret.getStyleFor=function(at){
      var sym= at.getSymbol();
      var style=ret._colorScheme.symbols[sym];
      if(style){
        return style;
      }
      return "black";
  };
  ret.getSuperScriptUTF8=function(ss, explSign, showOne){
      if(!(Math.abs(ss-0)>=0)){
         throw "Not a number:" + ss;   
      }
      if(explSign){
         if(ss-0>0){
            ss="+"+ss;
         }else{
            ss=ss+"";
         }
      }else{
         ss=ss+"";
      }
      if(!showOne){
         if(ss==="+1" || ss==="-1"){
            ss=ss[0];
         }
      }
      return ss.split("").map(dig=>{
            if(dig==="-"){
               return String.fromCodePoint(0x207B);
            }else if(dig==="+"){
               return String.fromCodePoint(0x207A);
            }else{
               if((dig-0)===1){
                  return String.fromCodePoint(0x00B9);
               }
               if(Math.abs(dig-0)<=3){
                   return String.fromCodePoint(0x00B0+Math.abs(dig-0));
               }else{
                   return String.fromCodePoint(0x2070+Math.abs(dig-0));
               }
            }
      }).join("");
  };
  /**
  Render the supplied chem object on the specified context
  at the X,Y coordinates, and scale it by "scale"
  **/
  ret.render = function(chem,ctx,startx,starty,scale){
         chem=JSChemify.Chemical(chem);
         //Should we clone first? Maybe better
         //not to mutate ... IDK
         if(!chem.hasCoordinates()){
            chem.generateCoordinates();
         }
         const rect=chem.getBoundingBox();
         const affine=JSChemify.AffineTransformation()
              .translate(startx,(rect[3]-rect[1])*scale+starty)
              .scale(scale,-scale)
              .translate(-rect[0],-rect[1]);
          
          
         const lseg=affine.transform([[1,0],[1,1]]);
         const deltSeg=[lseg[0][1]-lseg[0][0],
                       lseg[1][1]-lseg[1][0]];
         const fsize=scale*ret._labelSize;
         ctx.font = fsize+"px sans-serif";
    
         const text = ctx.measureText("C");
         const offx=text.width/2;
         const offy=-offx;
         const cleareRad=offx*ret._cleareRad;
         const wedge=ret._getWedge();
         const dash=ret._getDash();
         const bwidth=ret._bracketWidth*scale;
         // Set line width
         ctx.lineWidth = scale*ret._lineWidth;  
               
         const ppoint=[];
         const moveTo=(x,y,color)=>{
          ppoint[0]=[x,y];
          ctx.moveTo(x,y);
         };
         const fillText=(txt,x,y)=>{
          //TODO: nudge superscripts up
          // and subscripts down
         };
         const lineTo=(x,y, color1, color2)=>{
          if(color1 && color2 && color1!==color2){
              var oldX=ppoint[0][0];
              var oldY=ppoint[0][1];
              var mid=[oldX+(x-oldX)/2,oldY+(y-oldY)/2];
              
              ctx.strokeStyle=color1;
              ctx.lineTo(mid[0],mid[1]);
              ctx.stroke();
              ctx.strokeStyle=color2;
              ctx.beginPath();
              ctx.moveTo(mid[0],mid[1]);
              ctx.lineTo(x,y);
              
          }else{
              ctx.lineTo(x,y);
          }
          ppoint[0]=[x,y];
         };
         
    
         //draw bonds
         chem.getBonds().map(b=>{
            const seg=affine.transform(b.getLineSegment());
            const bo = b.getBondOrder();
            const dseg=[seg[0][0]-seg[1][0],seg[0][1]-seg[1][1]];
            const rej=[-ret._dblWidth*dseg[1],
                      ret._dblWidth*dseg[0]];
            let short=ret._dblShort;
            let styles=b.getAtoms().map(at=>ret.getStyleFor(at));
            ctx.strokeStyle="black";
            //If there's stereo, draw dash or wedge
            if(b.getBondStereo()){
                  const affWedge=JSChemify.Util
                    .getAffineTransformFromLineSegmentToLineSegment(
                    [[0,0],[1,0]],
                    seg);
                  if(b.getBondStereo()===
                     JSChemify.CONSTANTS.BOND_STEREO_WEDGE){
                      const nwedge=affWedge.transform(wedge);
                      ctx.moveTo(nwedge[0][0],nwedge[0][1]);
                      nwedge.map(w=>ctx.lineTo(w[0],w[1]));
                      ctx.closePath();
                      ctx.fill();
                   }else if(b.getBondStereo()===
                      JSChemify.CONSTANTS.BOND_STEREO_DASH){
                      const ndash=affWedge.transform(dash);
                      ctx.beginPath();
                      ndash.map(dl=>{
                        ctx.moveTo(dl[0][0],dl[0][1]);
                        ctx.lineTo(dl[1][0],dl[1][1]);
                      });
                      //ctx.closePath();
                      ctx.stroke();
                   }
                   return;
            }
            if(bo===2 || bo===4){
                //If the double bond is in a ring
                //center it
                if(!b.isInRing()){
                    seg[0][0]-=rej[0]/2;
                    seg[1][0]-=rej[0]/2;
                    seg[0][1]-=rej[1]/2;
                    seg[1][1]-=rej[1]/2;
                    short=0;
                }else{
                  const ring=b.getSmallestRings()[0];
                  const centerR=ring.getCenterPoint();
                  const dVec=JSChemify.Util
                                     .subtractVector(
                                       b._atom1.getPoint(),
                                       centerR);
                  const bVec=b.getDeltaVector();
                  const dd=JSChemify.Util.rejDotVector(dVec,bVec);
                  
                  if(dd>0){
                      rej[0]=-rej[0];
                      rej[1]=-rej[1];
                  }
                }
            }
        
            ctx.beginPath();
            moveTo(seg[0][0], seg[0][1],styles[0],styles[1]);
            lineTo(seg[1][0], seg[1][1],styles[0],styles[1]);
            //ctx.closePath();
            ctx.stroke();
            
            //Draw double bond
            if(bo===2 || bo===3 || bo===4){
              ctx.beginPath();
              if(bo===4){
                  let space=ret._dashSpace*scale;
                  ctx.setLineDash([space,space]);
              }
              moveTo(seg[0][0]+rej[0]-dseg[0]*short, seg[0][1]+rej[1]-dseg[1]*short,styles[0],styles[1]);
              lineTo(seg[1][0]+rej[0]+dseg[0]*short, seg[1][1]+rej[1]+dseg[1]*short,styles[0],styles[1]);
              //ctx.closePath();
              ctx.stroke();
              ctx.setLineDash([]);
            }
            //Draw triple bond
            if(bo===3){
              ctx.beginPath();
              moveTo(seg[0][0]-rej[0]-dseg[0]*short, seg[0][1]-rej[1]-dseg[1]*short,styles[0],styles[1]);
              lineTo(seg[1][0]-rej[0]+dseg[0]*short, seg[1][1]-rej[1]+dseg[1]*short,styles[0],styles[1]);
              //ctx.closePath();
              ctx.stroke();
            }
      });
      
      chem.getAtoms().map(at=>{
          const sym=at.getSymbol();
          if(sym!=="C" || at.getCharge() || at.getIsotope()){
              const nv=at.getVectorToPoint([0,0]);
              nv[0]=-nv[0];
              nv[1]=-nv[1];
        
        
              let loc=affine.transform(nv);
              let append="";
              let prepend="";
              let chg=at.getCharge();
              let iso=at.getIsotope();
              let nudgeDx=0;
              let nudgeDy=0;
              if(Math.abs(chg)>0){
                    append+=ret.getSuperScriptUTF8(chg,true,false);
              }
              if(iso>0){
                    prepend=ret.getSuperScriptUTF8(iso,false,true);
                    nudgeDx=-prepend.length*offx;
                    nudgeDy=0;
              }
             
        
              ctx.fillStyle = "white";
              ctx.beginPath();
              ctx.arc(loc[0], loc[1], cleareRad, 0, 2 * Math.PI);
              ctx.fill();
        
              ctx.fillStyle = ret.getStyleFor(at);
        
              if(at.getImplicitHydrogens()===0){
                  ctx.fillText(prepend+ sym+append,loc[0]-offx+nudgeDx,loc[1]-offy+nudgeDy);
              }else{
                  ctx.fillText(prepend+ sym,loc[0]-offx+nudgeDx,loc[1]-offy+nudgeDy);
              }
              
              
              if(at.getImplicitHydrogens()>0){
                const h=at.getImplicitHydrogens();
                const vec=at.getLeastOccupiedCardinalDirection();
                nv[0]=nv[0]-vec[0]*ret._letterSpace;
                nv[1]=nv[1]-vec[1]*ret._letterSpace;
                let ntext="H";
                if(h>1){
                  ntext+=String.fromCodePoint(8320+h);
                  if(vec[0]>0){
                    nv[0]=nv[0]-vec[0]*ret._letterSpace*0.5;
                  }
                }
                  
                if(vec[0]>0){
                    nv[0]=nv[0]-vec[0]*ret._letterSpace*(0.35*append.length);
                    append=[...append].reverse().join("");
                    loc=affine.transform(nv);
                    ctx.fillText(append+ntext,loc[0]-offx,loc[1]-offy);
                }else{
                    nv[0]=nv[0]-vec[0]*ret._letterSpace*(0.35*(sym.length-1));
                    loc=affine.transform(nv);
                    ctx.fillText(ntext+append,loc[0]-offx,loc[1]-offy);
                }
             }
              
        }
         
        if(at.getAtomMap()){
          if(ret._showAtomMapNumbers){
            ctx.font = fsize/2+"px sans-serif";
            let posVec=at.getPoint();
            posVec[0]=posVec[0]+0.25;
            posVec[1]=posVec[1]+0.25;
            let loc=affine.transform(posVec);
            ctx.fillStyle = "blue";
            ctx.fillText(at.getAtomMap()+"",loc[0]-offx/2,loc[1]-offy/2);
            ctx.fillStyle = "black";
            ctx.font = fsize+"px sans-serif";
          }
        }
        
      });     
      chem.getSGroups().map(sg=>{
            const brackets = affine.transform(sg.getBracketLocation());
            const label=sg.getLabel();
            let mult=1;
            brackets.map((bb,ii)=>{
               let delt=[bb[1][0]-bb[0][0],
                         bb[1][1]-bb[0][1]];
               delt=JSChemify.Util.normVector(delt);
               delt=[-delt[1],delt[0]];
                         
               ctx.strokeStyle="black";
               ctx.beginPath();
               moveTo(bb[0][0]+mult*bwidth*delt[0], bb[0][1]+mult*bwidth*delt[1]);
               lineTo(bb[0][0], bb[0][1]);
               lineTo(bb[1][0], bb[1][1]);
               lineTo(bb[1][0]+mult*bwidth*delt[0], bb[1][1]+mult*bwidth*delt[1]);
               
               ctx.stroke();

               if(ii===1 && label){
                  let loc=[bb[1][0]-mult*bwidth*delt[0],
                           bb[1][1]-mult*bwidth*delt[1]];
                  ctx.fillStyle = "black";
                  ctx.fillText(label,loc[0]-offx,loc[1]-offy);
                  ctx.fillStyle = "black";
                  //ctx.font = fsize+"px sans-serif";
               }
               //mult=mult*-1;
            });
            
      });
            
  }; //End render function
  return ret;
};

/*******************************
/* Tests
/*******************************

A simple set of basic test to make sure
JSChemify is working as expected.

To run all, do:
 JSChemify.Tests().runAll();
 
It will log the results to the console.

TODO: 
1. Allow a returned object about results
2. Give names to tests
3. Expand Tests
*******************************/
JSChemify.Tests=function(){
  ret={};
  ret._tests=[];
  
  ret.assertTrue=function(b,msg){
      if(!b){
        if(msg){
          throw "Assertion error: " + msg;
      }else{
          throw "Assertion error";
      }
    }
  };
  ret.assertEquals=function(a,b,msg){
    if(!msg){
        msg= a + " does not Equal " + b;
    }
        ret.assertTrue(a===b,msg);
    };
  ret.assertToStringEquals=function(a,b,msg){
    if(!msg){
        msg= a + " does not Equal " + b;
    }
        ret.assertTrue(a.toString()===b.toString(),msg);
    };
  ret.assertToStringNotEquals=function(a,b,msg){
    if(!msg){
        msg= a + " equals " + b;
    }
        ret.assertTrue(a.toString()!==b.toString(),msg);
    };
  ret.assertSameGraphIvariant=function(a,b,msg){
      if(!msg){
          msg = "'" + a + "' is not the same graph invariant as " + "'" + b + "'";
      }
      let ginv1=JSChemify.Chemical(a).getGraphInvariant();
      let ginv2=JSChemify.Chemical(b).getGraphInvariant();
      
      ret.assertToStringEquals(ginv1,ginv2,msg);
  };
  ret.assertSameSmiles=function(a,b,msg){
      if(!msg){
          msg = "'" + a + "' != " + "'" + b + "'";
      }
      ret.assertTrue(ret.sameSmiles(a,b),msg);
  };
  ret.assertSameSmilesAromatic=function(a,b,msg){
      if(!msg){
          msg = "'" + a + "' != " + "'" + b + "'";
      }
    a=JSChemify.Chemical(a).aromatize();
    b=JSChemify.Chemical(b).aromatize();
    ret.assertTrue(ret.sameSmiles(a,b),msg);
  };
  ret.assertSameSmilesKekulized=function(a,b,msg){
      if(!msg){
          msg = "'" + a + "' != " + "'" + b + "'";
      }
    a=JSChemify.Chemical(a).dearomatize();
    b=JSChemify.Chemical(b).dearomatize();
    ret.assertTrue(ret.sameSmiles(a,b),msg);
  };
  ret.sameSmiles=function(a,b){
      return JSChemify.Chemical(a).toSmiles()===JSChemify.Chemical(b).toSmiles();
  };
  
  ret.assertCleanCoordinates=function(a){
      var c=JSChemify.Chemical(a).generateCoordinates();
    var clusters=c.$getCloseClustersOfAtoms();
    ret.assertTrue(clusters.length===0,"overlapping atoms");
  };

  ret.tests={
      push:function(nm,o){
         if(typeof nm === "function"){
            o = nm;
            nm= "Unnamed Test:" + ret._tests.length;
         }
         if(o.name){
            ret._tests.push(o);
         }else{
            ret._tests.push({
               "name":nm,
               "test":o
            });
         }
      }
  };
  
  ret.runAll=function(){
    var passed=0;
    var failed=0;
    var total=ret._tests.length;
    ret._tests.map((t,i)=>{
        try{
            t.test();
            passed++;
         }catch(e){
             console.log("Test " + t.name + " Failed:" + e);
             failed++;
         }
         console.log("Test " + t.name + " Passed");
    });
    console.log("Tests passed:"+passed);
    console.log("Tests failed:"+failed);
  };
  
   //JSChemify.Chemical(JSChemify.Chemical("C").setProperty("abc", "val1\nval2").toSd()).toSd()
  ret.tests.push(()=>{
      let input="C1(=C(N(CCC(CC(CC(=O)O)O)O)C(=C(1)C2(C=CC=CC=2))C2(C=CC(=CC=2)F))C(C)C)C(NC1(C=CC=CC=1))=O R10m80L5RL7RLRLRRLRHRHL5L5L5R9RLLRRRRRLR13LRRRRRR5LRRRRRL5R7R7L7";
      let c = JSChemify.Chemical(input);
      let c2=JSChemify.Chemical(c.toMol());
      let smipp=c2.toSmilesPP();
      ret.assertEquals(smipp,input);
  });
  ret.tests.push(()=>{
      let input="C2(C(C1(CCCCC1)C)CCC2) L4M60LRLLLLLR3R5R5R5R5";
      let c = JSChemify.Chemical(input);
      let c2=JSChemify.Chemical(c.toMol());
      let smipp=c2.toSmilesPP();
      ret.assertEquals(smipp,input);
  });
  //C14(C(C2(CCC3(=C(C(CC1)(H)2)C=CC(O)=C3))(H))(CCC(4)O)H)C L3.9m80L6.5m96R6.2M96LLLLRLLR8L5L5L5R3m80WR7HR3HL3m80WLR3HRRRLRR
  ret.tests.push(()=>{
      var nonConvex=[[0,0],[1,0],[1,1],[0,1]];
      var convex=[[0,0],[1,0],[1,1],[0,1]];
    
      var nconvex=JSChemify.ShapeUtils().convexHull(nonConvex);
      ret.assertToStringEquals(nconvex,convex);
  });
  ret.tests.push(()=>{
      var nonConvex=[[0,0],[1,0],[0.9,0.5],[1,1],[0,1]];
      var convex=[[0,0],[1,0],[1,1],[0,1]];
    
      var nconvex=JSChemify.ShapeUtils().convexHull(nonConvex);
      ret.assertToStringEquals(nconvex,convex);
  });
  ret.tests.push(()=>{
      var nonConvex=[[0,0],[1,1],[1,0],[0,1]];
      var convex=[[0,0],[1,0],[1,1],[0,1]];
    
      var nconvex=JSChemify.ShapeUtils().convexHull(nonConvex);
      ret.assertToStringEquals(nconvex,convex);
  });
  ret.tests.push(()=>{
      var nonConvex=[[0.1214,0.33123],[0,0],[0.27,0.99],[0.11,0.36],[1,1],[1,0],[0,1],[0.11,0.37],[0.82,0.22222]];
      var convex=JSChemify.ShapeUtils().canonicalPathCCW([[0,0],[1,0],[1,1],[0,1]]);
      var nconvex=JSChemify.ShapeUtils().canonicalPathCCW(JSChemify.ShapeUtils().convexHull(nonConvex));
      ret.assertToStringEquals(nconvex,convex);
  });
  ret.tests.push(()=>{
      var nonConvex=[[0,0],[0,0],[1,1],[1,0],[0,1]];
      var convex=JSChemify.ShapeUtils().canonicalPathCCW([[0,0],[1,0],[1,1],[0,1]]);
      var nconvex=JSChemify.ShapeUtils().canonicalPathCCW(JSChemify.ShapeUtils().convexHull(nonConvex));
      ret.assertToStringEquals(nconvex,convex);
  });
  ret.tests.push(()=>{
      var nonConvex=[[0,0],[0.5,0.5],[0.25,0.25],[1,1],[1,0],[0,1]];
      var convex=JSChemify.ShapeUtils().canonicalPathCCW([[0,0],[1,0],[1,1],[0,1]]);
      var nconvex=JSChemify.ShapeUtils().canonicalPathCCW(JSChemify.ShapeUtils().convexHull(nonConvex));
      ret.assertToStringEquals(nconvex,convex);
  }); 
  ret.tests.push(()=>{
      var nonConvex=[[0,0],[1,1],[1,0],[1,0.25],[1,0.1],[0,1]];
      var convex=JSChemify.ShapeUtils().canonicalPathCCW([[0,0],[1,0],[1,1],[0,1]]);
      var nconvex=JSChemify.ShapeUtils().canonicalPathCCW(JSChemify.ShapeUtils().convexHull(nonConvex));
      ret.assertToStringEquals(nconvex,convex);
  });
  
  ret.tests.push(()=>{
    
    let propChem=JSChemify.Chemical(JSChemify.Chemical("C")
                                             .setProperty("abc", "val1\nval2")
                                             .setProperty("def", "okay")
                                             .toSd());
     
    ret.assertEquals(propChem.getProperty("abc"),"val1\nval2");
    ret.assertEquals(propChem.getProperty("def"),"okay");
  });
  ret.tests.push(()=>{
    var osmi= "[11CH2+2]";
    var nsmi=JSChemify.Chemical(JSChemify.Chemical(osmi).toSd()).toSmiles();
    ret.assertEquals(osmi,nsmi);
  });
  ret.tests.push(()=>{
    var chem1 = JSChemify.Chemical("C(=CC=C1)C(=C1N=2)N(C2)C.CCCC.O");
    var split=chem1.getComponents();
    ret.assertTrue(split.length===3,"split components should have 3 chemicals if 3 molecules");
    var splitSmiles=split.map(cc=>cc.toSmiles()).join(".");
    var oSmiles=chem1.toSmiles();
    ret.assertEquals(splitSmiles,oSmiles);
  });
  ret.tests.push(()=>{
    var chem1 = JSChemify.Chemical("C(=CC=C1)C(=C1N=2)N(C2)C");
    ret.assertTrue(!chem1.hasCoordinates(),"first read smiles shouldn't hae coordinates");
    chem1.generateCoordinates();
    ret.assertTrue(chem1.hasCoordinates(),"recently generated chem should have coordinates");
    
  });
  ret.tests.push(()=>{
    var chem1 = JSChemify.Chemical("C(=CC=C1)C(=C1N=2)N(C2)C");
    chem1.setProperty("Test",123);
    chem1.setName("test");
    chem1.generateCoordinates();
    var chem2 = chem1.clone();
    var oldMol=chem1.toSd();
    ret.assertEquals(oldMol,chem2.toSd());
    chem1.aromatize();
    chem1.setProperty("Another", 2);
    ret.assertEquals(oldMol,chem2.toSd());
  });
  ret.tests.push(()=>{
      var wt=JSChemify.Chemical("C[C@]12CC[C@H]3[C@H]([C@@H]1CC[C@@H]2O)CCC4=CC(=O)CC[C@]34C").getMolWeight();
    wt=Math.round(wt * 100) / 100;
      ret.assertEquals(288.40,wt);
  });
  ret.tests.push(()=>{
      var form=JSChemify.Chemical("C[C@]12CC[C@H]3[C@H]([C@@H]1CC[C@@H]2O)CCC4=CC(=O)CC[C@]34C").getMolFormula();
      ret.assertEquals("C19H28O2",form);
    form=JSChemify.Chemical("C").getMolFormula();
      ret.assertEquals("CH4",form);
  });
   
  ret.tests.push(()=>{
      ret.assertSameGraphIvariant(JSChemify.Chemical("CCn1(cc(c(=O)c2(ccc(nc(1)2)C))C(=O)O)").toSmiles(),
                         "CCn1(cc(c(=O)c2(ccc(nc(1)2)C))C(=O)O)");
  });
   
  ret.tests.push(()=>{
      ret.assertSameSmiles("C(=CC=C1)C(=C1N=2)N(C2)C",
                         "C(=CC=C1)C(=C1N=2)N(C2)C");
  });
  ret.tests.push(()=>{
      ret.assertSameSmiles("C(=CC=C1)C(=C1N=2)N(C2)C",
                         "C(=CC=C1)C(=C1N2)N(C=2)C");
  });
  ret.tests.push(()=>{
      ret.assertSameSmiles("c1ccccc1",
                         "C:1:C:C:C:C:C1");
  });
  ret.tests.push(()=>{
      ret.assertSameSmiles("c1ccccc1",
                         "c:1:c:c:c:c:c1");
  });
  ret.tests.push(()=>{
      ret.assertSameSmiles("c1ccccc1c2ccccc2",
                         "c1ccccc1-c2ccccc2");
  });
  ret.tests.push(()=>{
      ret.assertSameSmiles("c1ccccc1c2ccccc2",
                         "c1ccccc1-c2ccccc2");
  });
  ret.tests.push(()=>{
      ret.assertSameSmilesKekulized(
                         "c12c(c(=O)n(c(n1C)=O)C)n(C)cn2",
                         "C12(=C(C(=O)N(C(N(1)C)=O)C)N(C)C=N2)");
  });
  ret.tests.push(()=>{
      ret.assertSameSmilesAromatic(
                                             "c1ccccc1c2ccccc2",
                         "C1=CC=CC=C1C2=CC=CC=C2");
  });
  ret.tests.push(()=>{
      ret.assertCleanCoordinates(
                                             "C(C)(C)(C)(C)");
  });
  ret.tests.push(()=>{
      ret.assertCleanCoordinates(
                                             "CCCCCCCCCCCC");
  });
  ret.tests.push(()=>{
      ret.assertCleanCoordinates(
                                             "C(C(C(C(C(C(C(C(C))))))))");
  });
  ret.tests.push("Oxytocin Chain Structure Clean",()=>{
      ret.assertCleanCoordinates(
                                             "CCC(C)C(C(=O)NC(CCC(=O)N)C(=O)NC(CC(=O)N)C(=O)NC(CS)C(=O)N(CC2)C(C2)C(=O)NC(CC(C)C)C(=O)NCC(=O)N)NC(=O)C(CC(=CC=C1O)C=C1)NC(=O)C(CS)N");
  });
  ret.tests.push("Oxytocin Structure Clean", ()=>{
      ret.assertCleanCoordinates(
                                             "CC[C@H](C)[C@H]1C(=O)N[C@H](C(=O)N[C@H](C(=O)N[C@@H](CSSC[C@@H](C(=O)N[C@H](C(=O)N1)CC2=CC=C(C=C2)O)N)C(=O)N3CCC[C@H]3C(=O)N[C@@H](CC(C)C)C(=O)NCC(=O)N)CC(=O)N)CCC(=O)N");
  });
  ret.tests.push("Structure With Overlap Clean", ()=>{
      ret.assertCleanCoordinates(
                                             "CC(C)CC(NC(=O)C(CC1(C=CC=CC=1))NC(=O)C(N)CC1(C=CC=CC=1))C(=O)NC(CCCCN)C(=O)N1(CCC(N)(CC1)C(O)=O)");
  });
  //
  
  // TODO: this one fails right now
  // but we could fix it
  
  ret.tests.push("Triphenyl 4-bond Phosphorous Clean",()=>{
      ret.assertCleanCoordinates("C1=CC=C([P+](C2C=CC=CC=2)(CCCC#N)C2C=CC=CC=2)C=C1");
  });
  
  ret.tests.push(()=>{
      var matrix=[[1,2,3],
                 [4,5,6],
                 [7,8,9]];
      var matrixT=[[1,4,7],
                 [2,5,8],
                 [3,6,9]];
    var tmat=JSChemify.Util.matrixTranspose(matrix);
    var smatO=tmat.map(c=>c.join(",")).join(",");
    var tmatO=matrixT.map(c=>c.join(",")).join(",");
    ret.assertEquals(smatO,tmatO);
  });
  
  ret.tests.push(()=>{
      var matrix=[[1,0,0],
                 [0,1,0],
                 [0,0,1]];
    var tmat=JSChemify.Util.matrixInverse(matrix);
    var smatO=tmat.map(c=>c.join(",")).join(",");
    var tmatO=matrix.map(c=>c.join(",")).join(",");
    ret.assertEquals(smatO,tmatO);
  });
  
  ret.tests.push(()=>{
      var matrix=[[1,1,0],
                 [0,1,0],
                 [1,0,1]];
    var ident=[[1,0,0],
                [0,1,0],
                [0,0,1]];
    var tmat=JSChemify.Util.matrixInverse(matrix);
    tmat=JSChemify.Util.matrixMultiply(tmat,matrix,true);
    var smatO=tmat.map(c=>c.join(",")).join(",");
    var tmatO=ident.map(c=>c.join(",")).join(",");
    ret.assertEquals(smatO,tmatO);
  });
  
  ret.tests.push(()=>{
      var affine=JSChemify.AffineTransformation();
    var point=[1,2];
    var npoint=affine.transform(point);
    ret.assertToStringEquals(point,npoint);
  });
  
  
  ret.tests.push(()=>{
      var affine=JSChemify.AffineTransformation();
    affine=affine.translate(1,0);
    var point=[1,2];
    var npointExp=[2,2];
    var npoint=affine.transform(point);
    ret.assertToStringEquals(npoint,npointExp);
  });
  ret.tests.push(()=>{
      var affine=JSChemify.AffineTransformation();
    affine=affine.scale(10);
    var point=[1,2];
    var npointExp=[10,20];
    var npoint=affine.transform(point);
    ret.assertToStringEquals(npoint,npointExp);
  });
  ret.tests.push(()=>{
    var affine=JSChemify.AffineTransformation();
    affine=affine.translate(10,2);
    var point=[1,2];
    var npoint=affine.transform(point);
    npoint=affine.inverse().transform(npoint);
    ret.assertToStringEquals(point,npoint);
  });
  
  ret.tests.push(()=>{
      var affine=JSChemify.AffineTransformation();
    affine=affine.scale(2).translate(10,2);
    var affine2=affine.clone().inverse();
    var nothing=affine.clone().multiply(affine2);
    
    var point=[0,0];
    var npoint=nothing.transform(point);
    ret.assertToStringEquals(point,npoint);
  });
  
  ret.tests.push(()=>{
      var affine=JSChemify.AffineTransformation();
    affine=affine.scale(2).translate(10,2);
    var affine2=affine.clone().inverse();
    var nothing=affine.clone().multiply(affine2);
    
    var point=[0,0];
    var npoint=affine.transform(point);
    npoint=affine2.transform(npoint);
    ret.assertToStringEquals(point,npoint);
  });
  
  ret.tests.push(()=>{
      var affine=JSChemify.AffineTransformation();
    affine=affine.scale(2).translate(10,2);
    var affine2=JSChemify.AffineTransformation()
                                              .translate(-10,-2)
                          .scale(0.5);
    
    var point=[0,0];
    var npoint=affine.transform(point);
    npoint=affine2.transform(npoint);
    ret.assertToStringEquals(point,npoint);
  });
  
  
  //TODO: Not sure about this one
  ret.tests.push(()=>{
      var affine=JSChemify.AffineTransformation();
    affine=affine.translate(10,2).scale(2).translate(1,1);
    var affine2=JSChemify.AffineTransformation()
                          .translate(1,1)
                          .scale(2)
                          .translate(10,2);
    
    var point=[0,0];
    var npoint=affine.transform(point);
    var npoint2=affine2.transform(point);
    ret.assertToStringNotEquals(npoint,npoint2);
  });
  
  ret.tests.push(()=>{
  
    var affine=JSChemify.Util
             .getAffineTransformFromLineSegmentToLineSegment(
             [[0,1],[0,2]],
             [[0,0],[-3,7]],
             false);
    ret.assertToStringEquals(affine.transform([0,1]),[0,0]);
    ret.assertToStringEquals(affine.transform([0,2]),[-3,7]);
    //clockwise
    ret.assertToStringEquals(affine.transform([1,1]),[7,3]);
    
    affine=JSChemify.Util
             .getAffineTransformFromLineSegmentToLineSegment(
             [[0,1],[0,2]],
             [[0,0],[-3,7]],
             true);
    ret.assertToStringEquals(affine.transform([0,1]),[0,0]);
    ret.assertToStringEquals(affine.transform([0,2]),[-3,7]);
    //counter-clockwise
    ret.assertToStringEquals(affine.transform([1,1]),[-7,-3]);
    
    
  });
  
  
  //Double bond on wrong side in rendering
  //C(=O)(c1cc(c(c(I)c1)OCCN(CC)CC)I)c1c(oc2c1cccc2)CCCCCN(C)CC\C=C1\c2ccccc2CCc2ccccc12
  
  
  
  //bad bridgehead layout
  //[H]C1(CN2CCC1C[C@@]2([H])[C@H](O)C1=CC=NC2=C1C=C(OC)C=C2)C=C
  
  //Bad 3 fused rings case
  //OC14(C3(C(C(C1)F)=C(OC2(=CC(C#N)=CC(F)=C2))C=CC(=3)C(F)(F)C(F)(F)4)))
  
  //TODO
  //These generate weird but okay coordinates
  //COc1ccc(CCN(C)CCCC(C#N)(C(C)C)c2ccc(OC)c(OC)c2)cc1OC
  //NS(=O)(=O)c1cc2c(NC(NS2(=O)=O)C(Cl)Cl)cc1Cl
  
  //This one just doesn't get the right size
  //CC(C(O)=O)c1ccc(c(F)c1)-c1ccccc1
  
  //some stereo cases
  //C([C@@H](C)CC1)C[C@@H]1C
  
  //
  return ret;
};
