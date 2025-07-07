/**
JSChemify - a "pretty okay" basic cheminformatics library
written in native javascript.

TODO:

Refactoring:
1. Use const instead of let where possible
2. Use defined types instead of bespoke decorated
   objects (or maybe not)
3. [done?] Make renderer an object 
4. [done?] Precalculate layout objects for paths (up/down/left)
5. Make some of the vectors more standardized (e.g. be consistent with directions)

Basic I/O:
1. CIP designations (R/S)
2. [partial] Read double bond geometry from smiles
   2.1. [partial] Need to recalculate from bond 2d coordinates sometimes
   2.2. [partial] Need to preserve on coordinate generation
         2.2.1. Seems to work for simple cases, need to try complex ones
3. [started] InChI parser
4. [just for fun] WLN parser 
5. Simplify Smiles
   5.1. [done] There's a bug where closing parentheses aren't always added
   5.2. [done] And some exports corrupt the smiles like
         CCn1cc(c(=O)c2ccc(nc12)C)C(=O)O
         CCn1(cc(c(=O)c2(ccc(nc(12)C))C(=O)O) 
         CCn1cc(c(=O)c2ccc(nc12)C)C(=O)O 
   5.3. [done] When ending a ring, should remove extra parens
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
17. [partial] Molfile parity support
18. Molfile Chiral flag support
19. Rgroup decomposition
20. Edit distance
21. [done] fix ++ and -- reading of smiles
22. [partial] gzip base64 support for molfiles
    22.1. This currently uses promises. While that's
          technically fine, it means there's a mixmatch
          of promises and synchronous code which will be
          surprising to devs. It's possible to make this
          synchronous, but it may need to have more hardcore
          coding.
    22.2. It's also a problem that the ability to "sniff"
          a format is somewhat compromsied here. There's no
          current mechanism to sniff a base64 string, but
          if there were, it would have to return a promise
          on loading that, which is different than other
          cases. I wouldn't want to make it SOMETIMES return
          a promise. But I also don't want it to return a 
          promise unnecessarily.
23. [partial] molfile SGroup support
24. Improve dearomatization / aromatization
25. Add basic resolver? NCATS? GSRS? Pubchem?
26. Simple editor?
27. Simple namer?
28. Support daylight extended stereo (tetrahedrals, square planar, allene, trigonal pyrimidal)
29. [done] Some smiles strings seem to invert stereo
    29.1. Like:
      C(CCCCCCC(=O)N[C@@]1(H)([C@H](OC2(=C3(C=C4([C@@H](NC(=O)[C@H]5(NC(=O)[C@@H](CC6(=CC=C(O3)C=C6))NC([C@H]([N:1](C)N=O)C3(C=C(OC6(C=C(5)C(=C(C=6)O)Cl))C(=CC=3)O))=O))C(N[C@@H]3(C5(C=C(C6(=C(C=C(O)C=C(6)[C@H](NC([C@H]([C@@H](C6(=CC=C(OC(2)=C4)C(=C6)Cl))O)NC(3)=O)=O)C(=O)NCCCN(C)C)O[C@@H]2([C@@H](O)[C@@H](O)[C@H](O)[C@H](O2)CO)))C(O)=CC=5)))=O))))O[C@H](C(=O)O)[C@H]([C@@H](1)O)O))C(C)C
    29.2. Or simpler case:
      This
      P[C@H]1(CN[C@@H](C)C2(=CC=CC(=C2)OC2(=CC=C(C[C@H](CN1)N)C=C2)))
      Becomes
      P[C@@H]1(CN[C@@H](C)C2(=CC=CC(=C2)OC2(=CC=C(C[C@H](CN1)N)C=C2)))
      
      
      This
      CCCCP[C@]1([H])(CN[C@@H](C)C2(=CC=CC(=C2)OC2(=CC=C(C[C@H](CN1)N)C=C2)))
      Becomes
      CCCCP[C@@]1([H])(CN[C@@H](C)C2(=CC=CC(=C2)OC2(=CC=C(C[C@H](CN1)N)C=C2)))

Coordinates and Rendering:
 1. Coordinates: Fix bridgehead support
 2. Coordinates: in-line allenes
 3. [done] charges in render
 4. [done] Highlight atoms in render
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
17. [can't reproduce] SVG Bug: clearing background
18. [done] Path Encoding wedge and hash support
19. [done] Path encoding smiles bond order discrepency?
20. [done] Path encoding extended angles (complements)
21. Partial clean
   21.1. Partial clean with "fixed" atoms/bonds
   21.2. Pattial clean where the basics are kept,
         but minor adjustments improve the view
      21.2.1. This requires some thought. One way to
              do this is to specify the ideal layout
              for a given atom 
              (2 bonds means 120 degrees)
              (3 bonds still means 120)
              (4 bonds means either 90 or 3-120 and one
                 60)
              Also consider average bond length.
              For each atom which is found to be maximumly
              deviating from these patterns, adjust.
              It's worth considering a dynamics minimization
              algo too. It could help elsewhere. to do this
              we'd need to consider "springs" and displacements.
              Things we want to correct are bad angles, bad
              lengths, and overlapping bonds/atoms. This kind
              of alogithm probably works well for finding local
              minima, but bad for global ones. Swapping substituents
              probably is needed first.
22. [done] Path Notation:  Multiple components
23. Place subscripts a little down
24. [done] isotopes in render
25. [partial] Path Notation: Brackets
       Some notes about brackets...
          B1. SGroups are always collections of ATOMS
          B2. Sometimes they have 2 cross bond locations
          B3. Sometimes they cover whole molecules
          B4. In B2 and B3, we could specify the group 
              with [ and ] alone
          B5. If there is are 3+ cross bond locations
              I don't know what to do. Same with 1 cross
              bond.
          B6. Actual bracket location hard to specify
          B7. If MUL maybe [component]M1...{M1}...{M1}
              Label will be sum of M1 appearences (or M2, M3, etc)
          B8. If SRU maybe LRLR[LRL](lab)LR where lab is the label?
              Would use cross bonds for specifying
              LRLRL[LRLR[LR](lab)LRRL](lab)LRLRL possible
          B9. For SRU, also may want connectivity (though HT is almost always what we want)
              maybe [](lab_[HTE]) where H means head-to-head, T means Head-to-tail, and E
              means either? Probably default to T
          B10.For SRU location, we could make a few distinctions:
                 S1. BBOX of atoms
                 S2. vertical/horizonta at cross bonds
                 S3. Angled at cross bonds, same angle
                 S4. Angled at cross bonds, perp angle
26. [partial] Path notation estimate / tune max error?
27. Cut bonds short based on clear radius
28. Support double-either on double bonds

Basic Model Examples:
1. Do KNN with a variety of metrics
   1.1. Allow regression with either log space or
        other invertible functions. Can specify function
        and its inverse.
   1.2. Allow classification.
2. Do linear regression with e-topological descriptors
3. Embedding 
   3.1. MDS using distance geometry and a metric
   3.2. FASTMAP
   3.3. PCA of E-State Vectors
   3.4. PCA of topological indices
4. 

   

**/

var JSChemify={};
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
  if(arg._path)return arg;
  let ret={};
  ret._path=[];
  ret.closed=true;
  ret.toConvexHull=function(){
    let npath=JSChemify.ShapeUtils().convexHull(ret._path);
    return JSChemify.Shape(npath);
  };
  ret.intersection=function(s2){
    //TODO: intersection shape
    
     
  };
  ret.containsPoint=function(pt){
    //basic algo is iterate through delta vectors,
    //compute delta vector from first point to given
    //point, and then get the signed "rejection"
    //if the sign is different from the previous sign
    //then the point is NOT inside. Otherwise,
    //if every sign is the same, the point is inside.
    let ppoint=ret._path[0];
    let psign=0;
    for(let i=1;i<ret._path.length+1;i++){
      let npoint=ret._path[i%ret._path.length];
      let dvec=[npoint[0]-ppoint[0],npoint[1]-ppoint[1]];
      let pdvec=[pt[0]-ppoint[0],pt[1]-ppoint[1]];
      let rej=Math.sign(dvec[0]*pdvec[1]-dvec[1]*pdvec[0]);
      if(psign!==0 && rej!==0){
         if(rej!==psign){
            return false;
         }
      }
      psign=rej;
      ppoint=npoint;
    }
    return true;
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

JSChemify.LinearRegression=function(){
   let ret={};
   ret._x;
   ret._y;
   ret._pred;
   ret._r=null;
   ret._calculate;
   ret.setX=function(x){
      ret._x=x;
      return ret;
   };
   
   ret.setY=function(y){
      ret._y=y;
      return ret;
   };
   ret.predict=function(nx){
      if(!nx[0].length){
         nx=[nx];
      }
      let calc=ret.calculate();
      return JSChemify.Util.matrixTranspose(JSChemify.Util.matrixMultiply(JSChemify.Util.matrixTranspose(calc),nx));
   };
   ret.getPredicted=function(){
      if(!ret._pred){
         
         let calc=ret.calculate();
         ret._pred= JSChemify.Util.matrixTranspose(JSChemify.Util.matrixMultiply(JSChemify.Util.matrixTranspose(calc),ret._x));
      }
      return ret._pred;
   };
   ret.getR=function(){
      if(ret._r===null){
         let pred=ret.getPredicted();
         let meanY1=ret._y.map(a=>[a[0],1])
                        .reduce((a,b)=>{
                           return [a[0]+b[0],a[1]+b[1]];
                        });
         let meanY2=pred.map(a=>[a[0],1])
                        .reduce((a,b)=>{
                           return [a[0]+b[0],a[1]+b[1]];
                        });
         let rm1=meanY1[0]/meanY1[1];
         let rm2=meanY2[0]/meanY2[1];
         let centY1=JSChemify.Util.normVector(ret._y.map(a=>[a[0]-rm1]));
         let centY2=JSChemify.Util.normVector(pred.map(a=>[a[0]-rm2]));
         let pearson= JSChemify.Util.dotVector(centY1,centY2);
         ret._r=pearson;
      }
      return ret._r;
   };
   ret.getRSquared=function(){
      return Math.pow(ret.getR(),2);
   };
   ret.calculate=function(){
      if(!ret._calculate){
         let xT=JSChemify.Util.matrixTranspose(ret._x);
         let yT=JSChemify.Util.matrixTranspose(ret._y);
         let xxt=JSChemify.Util.matrixMultiply(xT,ret._x,true);
         let inv=JSChemify.Util.matrixInverse(xxt);
         let yxT=JSChemify.Util.matrixMultiply(yT,ret._x,true);
         let sol=JSChemify.Util.matrixMultiply(inv,yxT);
         
         ret._calculate=sol;

      }
      return ret._calculate;
      /*
         ax=y
         e=y-ax
         |e|^2=(y-ax)*(y-ax)T
         |e|^2=(y-ax)*(yT-xTaT)
         |e|^2=yyT-yXTaT-axyT+axxTaT
         derivitive
         d|e|^2/da=-yxT-xyT+2xxTaT
         2yxT=2xxTaT
         aT=(xxT^-1)*yxT
      */
      
   };
   return ret;
};

/*******************************
/* Color
/*******************************
Status: IN PROGRESS

Basic color object
   
*******************************/
JSChemify.Color=function(arg){
   if(arg && arg._rgba)return arg;
   
   let ret={};
   ret._rgba=null;
   ret.getRGBA=function(){
      if(ret._rgba)return ret._rgba;
      return [0,0,0,255];
   };
   ret.setColor=function(c){
      if(c._rgba){
         ret._rgba=c._rgba;
      }else{
         ret._rgba=JSChemify.ColorUtils()
                            .colorToRGBA(c);
      }
      return ret;
   };
   ret.toHex=function(suppressAlpha){
      let rgba=ret.getRGBA();
      return JSChemify.ColorUtils()
                      .colorToHex(rgba,!suppressAlpha);
   };
   ret.getAlpha=function(){
      return ret.getRGBA()[3];
   };
   ret.getTransparency=function(){
      return (255-ret.getAlpha())/255;
   };
   ret.getOpacity=function(){
      return 1-ret.getOpacity();
   };
   
   if(arg){
      return ret.setColor(arg);
   }
   return ret;
};
/*******************************
/* ColorUtils
/*******************************
Status: WORKING

Basic color utils
   
*******************************/
JSChemify.ColorUtils=function(){
  if(JSChemify.CONSTANTS && JSChemify.CONSTANTS.COLOR_UTILS){
      return JSChemify.CONSTANTS.COLOR_UTILS;
  }
  let ret={};
  if(JSChemify.CONSTANTS){   
      JSChemify.CONSTANTS.COLOR_UTILS=ret;
  }
  ret.$cache={};
   
  ret.byteToHex= function(num) {
      return ('0'+Math.round(num).toString(16)).slice(-2);
  };
  ret.colorToHex=function(rgba,includeAlpha) {
    let hex;
    hex = [0,1,2,3].filter(a=>(includeAlpha||a<3))
                   .map((idx)=>ret.byteToHex(rgba[idx])).join('');
    return "#"+hex;
  };

  ret.colorToRGBA= function(color) {
        if(color && color._rgba){
            return color.getRGBA();
        }
        if(Array.isArray(color) && color.length===4){
            return color;
        }
        if(Array.isArray(color) && color.length===3){
           let ncol=color.map(c=>c);
           ncol.push(255);
           return ncol;
        }
       // Returns the color as an array of [r, g, b, a] -- all range from 0 - 255
       // color must be a valid canvas fillStyle. This will cover most anything
       // you'd want to use.
       // Examples:
       // colorToRGBA('red')  # [255, 0, 0, 255]
       // colorToRGBA('#f00') # [255, 0, 0, 255]
       if(!ret.$cache[color]){
          let cvs, ctx;
          cvs = document.createElement('canvas');
          cvs.height = 1;
          cvs.width = 1;
          ctx = cvs.getContext('2d');
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, 1, 1);
          let cres= ctx.getImageData(0, 0, 1, 1).data;
          ret.$cache[color]=cres;
       }
        
       return ret.$cache[color];
  };

  /*
     Basic linear interpolation between c1
     and c2
  */
  ret.interpolate=function(c1,c2,v){
      c1=ret.colorToRGBA(c1);
      c2=ret.colorToRGBA(c2);
     
      return [
         c2[0]*v+c1[0]*(1-v),
         c2[1]*v+c1[1]*(1-v),
         c2[2]*v+c1[2]*(1-v),
         c2[3]*v+c1[3]*(1-v)
      ];
  };

  
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
      let delta1=[pt2[0]-pt1[0],pt2[1]-pt1[1]];
      let delta2=[pt3[0]-pt2[0],pt3[1]-pt2[1]];
      if((delta1[0]===0 && delta1[1]===0) ||
         (delta2[0]===0 && delta2[1]===0)
        ){
        return null;
      }
      let rej = delta1[0]*delta2[1]-delta1[1]*delta2[0];
      return rej;
  };
  ret.getIntersectionSegmentsCoeffs=function(line1,line2){
      let dvec1=[line1[1][0]-line1[0][0],line1[1][1]-line1[0][1]];
      let dvec2=[line2[1][0]-line2[0][0],line2[1][1]-line2[0][1]];
      let adiff=[line2[0][0]-line1[0][0],line2[0][1]-line1[0][1]];
      let mat=[[dvec1[0],dvec2[0]],[dvec1[1],dvec2[1]]];
      let inv=JSChemify.Util.matrixInverse(mat);
      let res=JSChemify.Util.matrixMultiply(inv,adiff);
      if(res[0]<0 || res[0]>1)return null;
      if(res[1]>0 || res[1]<-1)return null;
      
      return res;
  };
  ret.getIntersectionSegments=function(line1,line2){
      let res=ret.getIntersectionSegmentsCoeffs(line1,line2);
     
      let dvec1=[line1[1][0]-line1[0][0],line1[1][1]-line1[0][1]];
      let inter= [line1[0][0]+res[0]*dvec1[0],line1[0][1]+res[0]*dvec1[1]];
      if(isNaN(inter[0]))return null;
      
      return inter;
  };

  ret.getBoundingBox=function(pts, pad){
    if(typeof pad === "undefined"){
       pad=1;
    }
    if(pts && pts.length>0 && typeof (pts[0].getX) === "function"){
      pts=pts.map(pp=>[pp.getX(),pp.getY()]);
    }
    let bb= pts.map(at=>[at[0]-pad,at[1]-pad,at[0]+pad,at[1]+pad])
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
      let rej=Math.sign(ret.rejection(pts[ppi],fp[0],pts[npi]));
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

TODO: this should allow for setting
a maximum deviation, and round to
that, rather than an arbitrary 
universal precision. 
   
*******************************/
JSChemify.PathNotation=function(f){
    if(!f && JSChemify.CONSTANTS && JSChemify.CONSTANTS.PATH){
      return JSChemify.CONSTANTS.PATH;
    }
    let ret={};
   //This sets the absolute allowed
   //deviation for any given atom,
   // but it needs more work
   //ret._maxDeviation=0.00001;
   //ret._maxDeviation=0.00001;
    ret._roundAngle=10;
    ret._roundMag=1;
    ret.roundAngle=function(p){
      if(ret===JSChemify.CONSTANTS.PATH){
         return JSChemify.PathNotation(true)
                         .roundAngle(p);
      }else{
         ret._roundAngle=p;
         return ret;
      }
    };
    ret.roundMag=function(p){
      if(ret===JSChemify.CONSTANTS.PATH){
         return JSChemify.PathNotation(true)
                         .roundMag(p);
      }else{
         ret._roundMag=p;
         return ret;
      }
    };
    ret.expand=function(pth){
      let fpath=[];
      let regex=/([LRDSFfsdlr][0-9.]*)([Mm][0-9.]*)*([WwHhEe])*/y;
      //regex.lastIndex=0;
      while(regex.lastIndex<pth.length){
        let oindex=regex.lastIndex;
        let m=regex.exec(pth);
        if(!m){
           if(pth[oindex]==="["){
               
               regex.lastIndex=oindex+1;
               fpath.push(["["]);
           }else if(pth[oindex]==="," && pth[oindex+1]==="["){
               regex.lastIndex=oindex+2;
               fpath.push([",["]);
           }else if(pth[oindex]==="]"){
               let regex2=/\]M[0-9][0-9]*/y;
               regex2.lastIndex=oindex;
               let m2=regex2.exec(pth);
               if(m2){
                  regex.lastIndex=regex2.lastIndex;
                  fpath.push([m2[0]]);
               }else{
                  let regex3=/\]\([^\)]*\)*/y;
                  regex3.lastIndex=oindex;
                  let m3=regex3.exec(pth);
                  if(m3){
                     regex.lastIndex=regex3.lastIndex;
                     fpath.push([m3[0]]);
                  }else{
                     throw "Unexpected Path Notation:" + pth;
                  }
               }
           }else{
               throw "Unexpected Path Notation:" + pth;
           }
        }else{
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
      }
      return fpath;
    };
    
    ret.collapse=function(pth){
          return pth.map(v=>{
                  if(v[0][0]==="[" || v[0][0]==="]" || v[0][0]===","){
                     return v[0];
                  }
                  if(v[0].length>1 && (v[0][0]==="R"||v[0][0]==="L"||v[0][0]==="r"||v[0][0]==="l")){
                      let rc=Math.round((v[0].substr(1)-0)*ret._roundAngle)/ret._roundAngle;
                      v[0]=v[0][0] + rc;
                  }
                  if(v[0]==="R6"){
                    v[0]="R";
                  }else if(v[0]==="L6"){
                    v[0]="L";
                  }
                  if(v[1] && (v[1].length>1 && (v[1][0]==="M"||v[1][0]==="m"))){
                      let rc=Math.round((v[1].substr(1)-0)*ret._roundMag)/ret._roundMag;
                      v[1]=v[1][0] + rc;
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
        let d=path[0];
        let m=path[1];
        let ang=0;
        let inv=false;
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
         
          
        }
        if(d.toLowerCase()===d){
            inv=true;
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
        if(inv)m=-1*m;
        return [m*Math.cos(ang),m*Math.sin(ang)];
    };
    ret.pathFromDeltaVector=function(vec1,vec2){
       if(!vec2){
          vec2=[1,0];
       }
       let dot=vec1[0]*vec2[0] + vec1[1]*vec2[1];
       let rej=vec1[0]*vec2[1] - vec1[1]*vec2[0];
       
              
       let theta=Math.atan2(rej,dot);
       let theta2=Math.atan2(-rej,-dot);
       
       
       let c=(Math.PI*2)/theta;
       let c2=(Math.PI*2)/theta2;

       let diff1=Math.round(c)*Math.PI*2-theta;
       let diff2=Math.round(c2)*Math.PI*2-theta2;
       let inv=false;
       let neg=false;
       let smaller=false;
       if(Math.abs(diff2)>Math.abs(diff1)){
         inv=true;
         c=c2;
       }
       
       let mag1=JSChemify.Util.magVector(vec1);
       let mag2=JSChemify.Util.magVector(vec2);
       let magR=mag1/mag2;
       let magN=magR;
       let nm="M";
       
       if(magN>1){
         nm="m";
         magN=1/magN;
         smaller=true;
       }
       magN=magN*100;
       let dnm="L";
       let dnm2="l";
       if(c<0){
         dnm="R";
         c=-c;
         neg=true;
       }
       if(inv){
         dnm=dnm.toLowerCase();
       }
       let rAng=ret._roundAngle;
       let rMag=ret._roundMag;
       let rc=null;
       let rM=null;
       if(ret._maxDeviation){
         let rdVec=[magR*dot/(mag2*mag1),magR*rej/(mag1*mag2)];
         //the deviation is found by applying
         //the rounded transformation to the
         //source with successive rounding
         //until the result is less than 
         //the deviation
         let thetaB=0;
         let round=1;
         while(true){
            rc=Math.round(c*round)/round;
            thetaB=2*Math.PI/rc;
            if(neg)thetaB=-thetaB;
            if(inv)thetaB=thetaB+Math.PI;
            let nvec=[magR*Math.cos(thetaB),magR*Math.sin(thetaB)];
            let diffV=[nvec[0]-rdVec[0],nvec[1]-rdVec[1]];
            let dev=Math.sqrt(diffV[0]*diffV[0]+diffV[1]*diffV[1]);
            if(dev<ret._maxDeviation){
               break;
            }
            round=round*10;
            if(round>100000000)break;
         }
         round=0.1;
         let nextM=2;
         while(true){
            let tryM1=Math.round(magN*round)/round;
            let tryM=tryM1/100;
            if(smaller){
               tryM=1/tryM;
            }
            let nvec=[tryM*Math.cos(thetaB),tryM*Math.sin(thetaB)];
            let diffV=[nvec[0]-rdVec[0],nvec[1]-rdVec[1]];
            let dev=Math.sqrt(diffV[0]*diffV[0]+diffV[1]*diffV[1]);
            if(isNaN(dev))break;
            rM=tryM1;
            if(dev<ret._maxDeviation){
               
               break;
            }
            round=round*nextM;
            if(nextM===2){
               nextM=5;
            }else if(nextM===5){
               nextM=2;
            }
            if(round>100000)break;
         }
         
          
       }
       if(!rc){
          rc=Math.round(c*rAng)/rAng;
       }
       c=rc;
       if(!rM){
          rM=Math.round(magN*rMag)/rMag;
       }
       let sig=dnm+c;
       if(c>50){
          if(inv){
             sig="f";
          }else{
             sig="F";
          }
       }
       if((rM+"")==="NaN"){
            return ["S","M100"];
       }
       if(rM===0){
            return ["S","M100"];
       }
       return [sig, nm + rM];
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
  
  BOND_STEREO_WEDGE : 1,
  BOND_STEREO_DASH : 6,
  BOND_STEREO_WIGGLE : 4,
  BOND_STEREO_EITHER : 3,
  BOND_STEREO_NONE : 0,
   
  BOND_GEOM_UP : 1,
  BOND_GEOM_DOWN : 2,
  BOND_GEOM_LOCAL_E : 3,
  BOND_GEOM_LOCAL_Z : 4,

  BOND_REJECTION_ZERO_TOLERANCE : 0.001,
   

  PATH:JSChemify.PathNotation(),
  VECTORS_BASIS:JSChemify.BaseVectors(),
  
  ELEMENTS:[
  {atomicNumber:0,symbol:"*",mass:0,name:"StarAtom",period:0,group:0,valance:0,smiles:true},
  {atomicNumber:1,symbol:"H",mass:1.007,name:"Hydrogen",period:1,group:1,valance:1,smiles:false},
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
    let e= JSChemify.Util.$eLookup[s];
    if(!e)throw "Unknown element '" + s +"'";
    return e;
  },
  base64Decode:function(str){
        //sometimes may need to rethink atob?
        const binary_string = atob(str);
        const len = binary_string.length;
        const bytes = new Uint8Array(new ArrayBuffer(len));
        for (let i = 0; i < len; i++) {
          bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes;
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
       let sumSq=0;
       for(var i=0;i<a.length;i++){
           sumSq+=a[i]*a[i];
       }
       let nMag=1/Math.sqrt(sumSq);
       for(var i=0;i<a.length;i++){
           a[i]=a[i]*nMag;
       }
       return a;
  },
  dotVector:function(a,b){
      let dot=0;
      for(var i=0;i<a.length;i++){
        dot+=a[i]*b[i];
    }
    return dot;
  },
  rejDotVector:function(a,b){
      let rVec= JSChemify.Util
                        .recipricolVector(b);
    return JSChemify.Util.dotVector(a,rVec);                
  },
  recipricolVector:function(a){
      let n=[];
    n[0]=a[1];
    n[1]=-a[0];
    
    return n;
  },
  sqDist:function(a,b){
      let sumSq=0;
      for(var i=0;i<a.length;i++){
        sumSq+=(a[i]-b[i])*(a[i]-b[i]);
    }
    return sumSq;
  },
  magVector:function(a){
     return Math.sqrt(JSChemify.Util.sqMagVector(a));
  },
  sqMagVector:function(a){
      let sumSq=0;
      for(var i=0;i<a.length;i++){
        sumSq+=(a[i])*(a[i]);
    }
    return sumSq;
  },
  matrixTranspose:function(m){
      let t=[];
    for(var i=0;i<m.length;i++){
        let cvec=m[i];
      for(var j=0;j<cvec.length;j++){
          let c=cvec[j];
        if(!t[j])t[j]=[];
           t[j][i]=c;
      }
    }
    return t;
  },
  matrixOperate:function(m1,op){
    if(op.op==="swap"){
        let oldR=op.rows[0];
        let newR=op.rows[1];
      let t=m1[newR];
      m1[newR]=m1[oldR];
      m1[oldR]=t;
    }else if(op.op === "subtract"){
        let headi=op.rows[0];
        let taili=op.rows[1];
      let headr=m1[headi];
      let tailr=m1[taili];
      let mult=op.mult;
      for(var i=0;i<headr.length;i++){
          let sub=headr[i]*mult;
        tailr[i]=tailr[i]-sub;
      }
    }else if(op.op === "multiply"){
        let ri=op.row;
      let mult=op.mult;
      let row=m1[ri];
      for(var i=0;i<row.length;i++){
          row[i]=row[i]*mult;
      }
    }
    return m1;
  },
  matrixIdentity:function(s){
      let mat=[];
    for(var i=0;i<s;i++){
        let row=[];
      for(var j=0;j<s;j++){
                row.push(0);
      }
      row[i]=1;
      mat.push(row);
    }
    return mat;
  },
  matrixInverse:function(m1){
      let dcopy = m1.map(m=>m.map(a=>a));
    let ident= JSChemify.Util.matrixIdentity(m1.length);
    for(var pos=0;pos<m1.length-1;pos++){
      let top = dcopy.map((r,i)=>[i,r[pos]])
      .filter(b=>(b[0]>=pos))
      .reduce((a,b)=>{
        if(Math.abs(a[1])>Math.abs(b[1]))return a;
        return b;
      });
      if(top[0]!==pos){
        let op={"op":"swap", rows:[pos,top[0]]};
        JSChemify.Util.matrixOperate(dcopy,op);
        JSChemify.Util.matrixOperate(ident,op);
      }
      let row = dcopy[pos];
      let lead= row[pos];
      for(var i=pos+1;i<dcopy.length;i++){
        let lead2=dcopy[i][pos];
        if(lead2===0)continue;
        let rat=lead2/lead;
        let op={"op":"subtract", rows:[pos,i], mult:rat};
        JSChemify.Util.matrixOperate(dcopy,op);
        JSChemify.Util.matrixOperate(ident,op);
      }
    }
    //now the other way
    for(var pos=dcopy.length-1;pos>0;pos--){
        let lead = dcopy[pos][pos];
      for(var i=pos-1;i>=0;i--){
          let lead2=dcopy[i][pos];
        if(lead2===0)continue;
        
        let rat=lead2/lead;
        
        let op={"op":"subtract", rows:[pos,i], mult:rat};
        JSChemify.Util.matrixOperate(dcopy,op);
        JSChemify.Util.matrixOperate(ident,op);
      }
    }
    //finally resize
    for(var i=0;i<dcopy.length;i++){
        let rat=1/dcopy[i][i];
        let op={"op":"multiply", row:i, mult:rat};
      JSChemify.Util.matrixOperate(dcopy,op);
      JSChemify.Util.matrixOperate(ident,op);
    }
    return ident;
  },
  matrixMultiply:function(m1,m2T,t){
    let oneVec=false;
    if(!Array.isArray(m2T[0])){
      m2T=[m2T];
      oneVec=true;
    }
    if(t){
        m2T=JSChemify.Util.matrixTranspose(m2T);
    }
    let pro=[];
    
    for(var x=0;x<m1.length;x++){
        let row=m1[x];
        let result=[];
        for(var y=0;y<m2T.length;y++){
          let column=m2T[y];
          let dot=0;
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
      let opoint=s1[0];
    let npoint=s2[0];
    let ovecDelta=[s1[1][0]-s1[0][0],s1[1][1]-s1[0][1]];
    let nvecDelta=[s2[1][0]-s2[0][0],s2[1][1]-s2[0][1]];
    let xvec=[1,0];
    
    if(inv){
        let  trans=JSChemify.Util.getTransformFromVectorToVector(
        ovecDelta,
        xvec
        );
      let yInv=[[1,0],[0,-1]];
      let  trans2=JSChemify.Util.getTransformFromVectorToVector(
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
    let  trans=JSChemify.Util.getTransformFromVectorToVector(
    ovecDelta,
    nvecDelta
    );
    let affine=JSChemify.AffineTransformation()
                 .translate(npoint[0],npoint[1])
                 .multiply(trans)
                 .translate(-opoint[0],-opoint[1]);
    
    return affine;
  },
  getTransformFromVectorToVector:function(v1,v2){
      let dot=0;
    let rej=0;
    let alt=1;
    //not sure about the generality here
    for(var i=0;i<v1.length;i++){
        let si = (i+1)%v1.length;
        dot+=v1[i]*v2[i];
      rej+=v1[i]*v2[si]*alt;
      alt=alt*-1;
    }
    let mag1=JSChemify.Util.sqMagVector(v1);
    let mag2=JSChemify.Util.sqMagVector(v2);
    let adj=1/mag1;
    dot=dot*adj;
    rej=rej*adj;
    
    //TODO: think about general case
    //only works for 2x2
    return [[dot,-rej],[rej,dot]];
  }
};
JSChemify.Util.simpleEncode=function(o){
    return encodeURIComponent(o).replace(/%/g,"q_Q");
};
JSChemify.Util.simpleDecode=function(o){
    return decodeURIComponent(o.replace(/q_Q/g,"%"));
};
JSChemify.Util.isPromise=function(o){
    if(o && typeof o === "object" && o.then && typeof o.then === "function"){
        return true;
    }
    return false;
};
JSChemify.Util._loadCache={};
JSChemify.Util.loadLibrary=function(path, test){
     if(JSChemify.Util._loadCache[path]){
          return JSChemify.Util._loadCache[path];
     }
     function dynamicallyLoadScript(url) {
        var script = document.createElement("script");  // create a script DOM node
        script.src = url;  // set its src to the provided URL
       
        document.head.appendChild(script);  // add it to the end of the head section of the page (could change 'head' to 'body' to add it to the end of the body section instead)
     }
    //TODO: consider how to load differently if in different contexts
    if(test()){
    return new Promise(ok=>{
        ok();
        }); 
    }else{
        dynamicallyLoadScript(path);
        let promise= new Promise(ok=>{
        let tempPoll = { "pol" : null};
        let pollLoad = ()=>{
          if(test()){
            ok();
          }else{
            setTimeout(()=>{
              tempPoll.pol();
            },20);
          }
        };
        tempPoll.pol=pollLoad;
        if(test()){
            ok();
        }else{
            tempPoll.pol();
        }
        });
        JSChemify.Util._loadCache[path]=promise;
    return promise;
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
    let ret={};
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
       let nmat=mm.map(c=>{
           let nvec=c.map(cc=>cc);
        nvec.push(0);
        return nvec;
       });
       nmat.push([0,0,1]);
       mm=nmat;
      }
    }
    let mat1=mm;
    let mat2=ret.getMatrix();
    if(pre){
        mat1=mat2;
      mat2=mm;
    }
    let nmat=JSChemify.Util
                       .matrixMultiply(mat2,mat1,true);
    ret._matrix=nmat; 
    return ret;
  };
  ret.preMultiply=function(mm){
      return ret.multiply(mm,true);
  };
  ret.translate=function(x,y,pre){
      let nmat=[[1,0,x],[0,1,y],[0,0,1]];
    return ret.multiply(nmat,pre);
  };
  ret.preTranslate=function(x,y){
      return ret.translate(x,y,true);
  };
  ret.scale=function(sx,sy){
      if(!sy)sy=sx;
      let mat=ret.getMatrix();
    for(var i=0;i<mat.length-1;i++){
        for(var j=0;j<mat.length-1;j++){
          if(i===0)mat[i][j]*=sx;
        if(i===1)mat[i][j]*=sy;
      }
    }
    return ret.setMatrix(mat);
  };
  ret.rotate=function(theta,pre){
      let mat=[[ Math.cos(theta),Math.sin(theta)],
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
    let nv= JSChemify.Util
                    .matrixMultiply(ret.getMatrix(),
                    vec);
    nv.pop();
    return nv;
  };
  ret.inverse=function(){
    let mnew=JSChemify.Util.matrixInverse(ret.getMatrix());
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
  let ret={};
  ret._def=def;
  return ret;
};

/*******************************
/* Atom
/*******************************
Status: WORKING

An object/builder for a chemical atom.
   
*******************************/
JSChemify.Atom = function(aaa){
  if(aaa && aaa._chemType === JSChemify.CONSTANTS.CHEM_TYPE_ATOM){
      return aaa;
  }
  let ret={};
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
    let nat=JSChemify.Atom();
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
  ret.setAtomTo=function(a){
    ret._symbol=a._symbol;
    ret._charge=a._charge;
    ret._isotope=a._isotope;
    ret._radical=a._radical;
    ret._map=a._map;
    
    ret._x=a._x;
    ret._y=a._y;
    ret._z=a._z;
    ret._parity=a._parity;
    return ret;
  };
  
  ret.setSymbol=function(s){
    ret._symbol=s;
    return ret;
  };
  ret.setRadical=function(r){
    ret._radical=r;
    return ret;
  };
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
  
  ret.swapSubstituentCoordinates=function(bond1,bond2, newVector){
      let awayVec=null;
      let homeVec=null;
      let cPnt=ret.getPoint();
      if(bond1 && !JSChemify.Util.isBond(bond1)){
         bond1=ret.getBonds()[bond1];
      }
      if(bond2 && !JSChemify.Util.isBond(bond2)){
         bond2=ret.getBonds()[bond2];
      }
      if(!bond2){
         if(newVector){
            awayVec=newVector;
         }else{
            awayVec=ret.getLeastOccupiedVector();
            awayVec=[-awayVec[0],-awayVec[1]];
         }
      }
      homeVec=ret.getVectorTo(bond1.getOtherAtom(ret));
      let network=ret.getConnectedNetworkAndBonds();
      let net1=network.find(n=>n.bond===bond1);
      let net2=null;
      if(bond2){
         net2=network.find(n=>n.bond===bond2);
         awayVec=ret.getVectorTo(bond2.getOtherAtom(ret));
      }
      let mat=JSChemify.Util.getTransformFromVectorToVector(homeVec,awayVec);
      let revmat=JSChemify.Util.getTransformFromVectorToVector(awayVec,homeVec);
      let vecs=Object.keys(net1.network)
                      .map(ai=>ret.getParent().getAtom(ai))
                      .map(at=>at.getVectorTo(ret))
                      .map(v=>JSChemify.Util.matrixMultiply(mat,v))
                      .map(v=>JSChemify.Util.addVector(v,cPnt));
      Object.keys(net1.network)
            .map((ai,i)=>ret.getParent().getAtom(ai).setXYZ(vecs[i][0],vecs[i][1]));
      let rvecs=null;
      if(net2){
         rvecs=Object.keys(net2.network)
                      .map(ai=>ret.getParent().getAtom(ai))
                      .map(at=>at.getVectorTo(ret))
                      .map(v=>JSChemify.Util.matrixMultiply(mat,v))
                      .map(v=>JSChemify.Util.addVector(v,cPnt));
         Object.keys(net2.network)
               .map((ai,i)=>ret.getParent().getAtom(ai).setXYZ(rvecs[i][0],rvecs[i][1]));
      }
      return ret;

  };

  ret.setParityFromStereoBond=function(keep){
    if(ret.getParity()!==0 && keep)return ret;
    //TODO: figure this out. I thnk 
    let neighbors =ret.getNeighborAtomsAndBonds();
    //start with the 3 case
    // parity is 1 if there are only
    // wedges
    let parity=0;
    let allW=[];
    let allH=[];
    let mult=false;

    if(neighbors.length>=3){
      parity=1;
    }
     
    if(neighbors.length===4){
         neighbors=neighbors.filter((ns,i)=>{
                    if(allW.length>0 || allH.length>0)return true;
                    let bs=ns.bond.getBondStereo();
                    if(bs === JSChemify.CONSTANTS.BOND_STEREO_WEDGE){
                        allW.push(ns);
                        if(i%2!==1){
                           //parity=parity*-1;
                        }
                        mult=true;
                        return false;
                    }else if(bs === JSChemify.CONSTANTS.BOND_STEREO_DASH){
                        allH.push(ns);
                        if(i%2!==1){
                           //parity=parity*-1;
                        }
                        mult=true;
                        return false;
                    }
                    return true;
                 });
          if(!mult){
            return ret.setParity(0);
          }
          if(mult){
            parity=parity*-1;
          }
    }
     
    if(neighbors.length===3){
        neighbors.filter(ns=>ns.bond.getAtom1()===ret)
                 .filter(ns=>ns.bond.getBondStereo()!==0)
                 .map(ns=>{
                    let bs=ns.bond.getBondStereo();
                    if(bs === JSChemify.CONSTANTS.BOND_STEREO_WEDGE){
                        if(!mult){
                           allW.push(ns);
                        }
                    }else if(bs === JSChemify.CONSTANTS.BOND_STEREO_DASH){
                        if(!mult){
                           allH.push(ns);
                        }
                    }else{
                        parity=0;  
                    }
                 });
        if((allW.length===0 && allH.length===0) || parity ===0){
            return ret.setParity(0);
        }
        if(allW.length>0 && allH.length>0){
           //ambiguous stereo 
           return ret.setParity(0);
        }
        if(allH.length>0)parity=parity*-1;
        
           
               
        let pn=neighbors[0].atom;
        let nn=neighbors[1].atom;
        let ln=neighbors[2].atom;
        let chainDir = pn.getVectorTo(nn);
        let orthoDir = pn.getVectorTo(ln);
        let rej=chainDir[0]*orthoDir[1]-chainDir[1]*orthoDir[0];
        if(rej<0){
            parity=parity*-1;
        }

        let oSter=allW;
        if(allH.length>0)oSter=allH;

        
        oSter.map(b=>{
            let oatoms=neighbors.filter(nb=>nb!==b).map(nb=>nb.atom);
            for(let i=0;i<oatoms.length;i++){
               for(let j=i+1;j<oatoms.length;j++){
                  let atom1=oatoms[i];
                  let atom2=oatoms[j];
                  let dVec=atom1.getVectorTo(atom2);
                  let wVec=atom1.getVectorTo(b.atom);
                  let oVec=atom1.getVectorTo(ret);
                  let nrej1= dVec[0]*wVec[1]-dVec[1]*wVec[0];
                  let nrej2= dVec[0]*oVec[1]-dVec[1]*oVec[0];
                  if(Math.sign(nrej1)!==Math.sign(nrej2)){
                     parity=parity*-1;
                  }
               }   
            }
        });
           
    }
     
    if(parity===-1){
         return ret.setParity(1);
    }else if(parity===1){
         return ret.setParity(2);
    }
    return ret.setParity(0);
    
  };
  
  ret.setStereoBondFromParity=function(){
      let par=ret.getParity();
      if(par===1||par===2){
        let neighbors =ret.getNeighborAtomsAndBonds();
        let pn=neighbors[0].atom;
        let nn=neighbors[1].atom;
        let ln=neighbors[2].atom;
        let chainDir = pn.getVectorTo(nn);
        let orthoDir = pn.getVectorTo(ln);
        let rej=chainDir[0]*orthoDir[1]-chainDir[1]*orthoDir[0];
        let order=neighbors
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
         let ss=ret.getBonds()
            .map(b=>({"bond":b,"atom":b.getOtherAtom(ret)}))
            .sort(order);
         return ss;
      }
      return ret.getBonds()
                .map(b=>({"bond":b,"atom":b.getOtherAtom(ret)}));
  };
  ret.getCenterPointOfNeighbors=function(){
    let sumV=ret.getNeighborAtomsAndBonds()
       .map(a=>a.atom)
       .map(a=>[a.getX(),a.getY(),1])
       .reduce((a,b)=>JSChemify.Util.addVector(a,b));
    sumV[0]=sumV[0]/sumV[2];
    sumV[1]=sumV[1]/sumV[2];
    sumV.pop();
    return sumV;
  };
  ret.getVectorAwayFromNeighborCenters=function(){
    let cent=ret.getCenterPointOfNeighbors();
    let vecTo=ret.getVectorToPoint(cent);
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
    let sqDist=dist*dist;
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
          let bnds=ret.getBonds();
      return bnds.length==1;
  };
  
  ret.getValance=function(){
      return ret.getElement().valance - (ret.getCharge());
  };
  ret.getElectronsInExplicitBonds=function(){
      if(ret.getBondCount()==0){
          return 0;
      }
      let te=ret.getBonds().map(b=>b.getBondOrder()).map(bo=>(bo==4)?3:bo*2).reduce((a,b)=>a+b)/2;
      return te;
  };
  ret.getLonePairs=function(){
      return Math.max(0,ret.getValance()-4);
  };
  
  ret.getDeltaV=function(){
      let val=ret.getValance();
      let hT=ret.getTotalHydrogenCount();
      return val-hT;
  };
  ret.getDelta=function(){
      return ret.getBondCount()-ret.getExplicitHydrogens();
  };
  ret.getIntrinsicState=function(){
      let val=ret.getValance();
      let hI=ret.getImplicitHydrogens();
      let hE=ret.getExplicitHydrogens();
      let hT=hI+hE;
      let n=ret.getElement().period;
      let sigma = ret.getBondCount()-hE;
      let fac = (2/n)*(2/n);
    
      return (fac*(val-hT)+1)/(sigma);    
  };

   
  ret.getEState=function(MAX_DEPTH){
    if(!MAX_DEPTH)MAX_DEPTH=15;
    let e0=ret.getIntrinsicState();
    let eSum=e0;
    for(var i=1;i<MAX_DEPTH;i++){
        let sqDist=1.0/((i+1)*(i+1));
        eSum+=ret.getAtomsAtDistance(i).map(at=>((e0-at.getIntrinsicState()))).reduce((a,b)=>a+b,0)*sqDist;
    }
    return eSum;
  };
  
  ret.getKierHallAtomType2=function(){
  let prefix="E" + ret.getNeighborAtomsAndBonds().filter(ba=>ba.atom.getSymbol()!=="H")
                    .map(ba=>ba.bond.getBondOrder())
                    .sort()
                    .map(b=>{
                    if(b===1)return "s";
                    if(b===2)return "d";
                    if(b===3)return "t";
                    if(b===4)return "a";
                    }).join("");
     let hcount=ret.getTotalHydrogenCount();      
     if(hcount>0){
         return prefix + ret.getElement().group + "H"+hcount;
     }else{
      return prefix + ret.getElement().group;
     }
  };
  ret.getKierHallAtomType=function(){
      let prefix=ret.getNeighborAtomsAndBonds().filter(ba=>ba.atom.getSymbol()!=="H")
                    .map(ba=>ba.bond.getBondOrder())
                    .sort()
                    .map(b=>{
                    if(b===1)return "s";
                    if(b===2)return "d";
                    if(b===3)return "t";
                    if(b===4)return "a";
                    }).join("");
     let hcount=ret.getTotalHydrogenCount();      
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
        let expectedBonds=ret.getValance()-(ret.getLonePairs()*2);
        let explicit=ret.getElectronsInExplicitBonds();
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
      let bonds=ret.getBondsCCW(filt);
      let maxAng=-1000;
      let bAng=null;
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
      let up=[0,1];
      let right=[1,0];
      let gvec=ret.getLeastOccupiedVector();
      let dot1=gvec[0]*up[0]+gvec[1]*up[1];
      let dot2=gvec[0]*right[0]+gvec[1]*right[1];
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
         let tmp={};
         ret.$allPathsDepthFirst((p)=>{
             if(p.length<2)return;
             let head =p[p.length-1];
             let root =p[1];
           //don't get root ring bonds as network
           if(root.bond.isInRing())return true;
           let rootBondIndex=root.bond.getIndexInParent();
           let onet=tmp[rootBondIndex];
           if(!onet){
               onet={};
               tmp[root.bond.getIndexInParent()]=onet;
           }
           //add atom as foliage
           onet[head.atom.getIndexInParent()]=true;
         });
         ret.$connectedNetworks=Object.keys(tmp).map(k=>{
           let rbond = ret.getParent().getBond(k);
           //var atoms = Object.keys(tmp[k]).map(ai=>ret.getParent().getAtom(ai));
           let atoms = tmp[k];
           return {"bond":rbond,"network":atoms};
         });
       }
      return ret.$connectedNetworks;
  };
  
  //will call cb for each subPart
  ret.$allPathsDepthFirst=function(cb,sofar,verbose,order, forcePop){
     
    if(!sofar){
        sofar=[{"atom":ret,"bond":null}];
    }
    let nbonds = ret.getNeighborAtomsAndBonds(order);
    let okBonds = nbonds.filter(checkBond=>sofar.findIndex(sf=>sf.bond===checkBond.bond)<0);
    for(var i=0;i<okBonds.length;i++){
        let checkBond = okBonds[i];
      //not part of the path
            let type;
      if(okBonds.length===1){
          type= "CHAIN";
      }else{
          type=(i===okBonds.length-1)?"CHAIN_BRANCH":"BRANCH";
      }
     
      sofar.push(checkBond);
      //STOP if return true
      let eva=!cb(sofar,type);
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
        let chg="0";
        let map=ret.getAtomMap();
        if(!map){
          map=0;
        }
        if(ret.getCharge()!==0 && 
           Math.abs(ret.getCharge())<=4){
           chg=4-ret.getCharge();
        }
        //TODO: Add parity?
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
    let x= line.substr(0,10).trim()-0;
    let y= line.substr(10,10).trim()-0;
    let z= line.substr(20,10).trim()-0;
    let symbol= line.substr(31,3).trim();
    let charge= line.substr(37,3).trim();
    
    let map= line.substr(61,3).trim();
    if(map && map!=="0"){
        ret.setAtomMap(map);
    }

     //TODO: read parity, isotope, radical
    
    
    if(charge && charge!=="0"){
        ret.setCharge(-(charge-4));
    }
    return ret.setXYZ(x,y,z).setSymbol(symbol);
  };
  
  
  ret.toSmiles=function(pp){
    let eH=ret.getImplicitHydrogens();
    let ehShow = (eH>1)?eH:"";
    let simpleOkay =ret.getElement().smiles;
    if(simpleOkay && !ret._isotope && !ret._charge && !ret._map && !ret._parity){
        if(ret.isAromatic()){
          return ret.getSymbol().toLowerCase();
      }
      return ret.getSymbol();
    }
    let chargeStr=ret._charge+"";
    if(ret._charge>0){
        chargeStr="+" + ret._charge;
    }
    
    if(chargeStr==="-1")chargeStr="-";
    if(chargeStr==="+1")chargeStr="+";
    if(chargeStr=== "0")chargeStr="";


    //the parity stored is the opposite of the parity
    //expected by smiles if:
    // 1. There's an implicit hydrogen (this counts as a new atom in
    //    smiles, but not in the parsing)
    // 2. There's a ring closing bond (with special exceptions)
     
    let parity = ret._parity;
    if(parity){
          if(!pp)pp=1;
          let swap=pp;
          if(eH>0){
            swap=swap*-1;
          }
          //TODO: Consider reconsidering this
          //let rbc=ret.getBonds().filter(b=>b.isInRing()).count;
          //if rbc =0,3, do nothing
          //if rbc =2, swap
          //if(rbc===2)swap=swap*-1;
      
          if(swap<0){
            if(parity===1)parity=2;
            else if(parity===2)parity=1;
          }
          
          if(parity-0===1){
               parity="@";
          }else if(parity-0===2){
               parity="@@";
          }else{
               parity="";
          }
     }
     
    
    let rr= "["
      +((ret._isotope)?(ret._isotope):("")) +
      ret._symbol +
      ((parity)?(parity):"") +
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
JSChemify.Bond = function(bbb){
  if(bbb && bbb._chemType === JSChemify.CONSTANTS.CHEM_TYPE_BOND){
      return bbb;
  }
  let ret={};
  ret._chemType = JSChemify.CONSTANTS.CHEM_TYPE_BOND;
  //will be parent chemical
  ret._parent=null;
  ret._order=1;
  ret._stereo=JSChemify.CONSTANTS.BOND_STEREO_NONE;
  ret._geom=null; 
  ret._atom1=null;
  ret._atom2=null;
  
  
  ret.$smallestRingSize=null;
  ret.$indexInParent=null;
  ret.$dirty=-1;
  
  ret.clone=function(){
    let bnd=JSChemify.Bond();
    bnd._order=ret._order;
    bnd._stereo=ret._stereo;
    bnd._atom1=ret._atom1;
    bnd._atom2=ret._atom2;
    bnd._geom=ret._geom;
    return bnd;
  };
  ret.setBondTo=function(b){
    ret._order=b._order;
    ret._stereo=b._stereo;
    ret._geom=b._geom;
    if(b._atom1){
       ret._atom1=b._atom1;
    }
    if(b._atom2){
       ret._atom2=b._atom2;
    }
    return ret;
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
  ret.getBondGeometry=function(){
      return ret._geom;
  };
  ret.setBondGeometry=function(g){
      ret._geom=g;
      return ret;
  };

  ret.setDoubleBondLocalGeometry=function(keep,order){
      if(ret.getBondGeometry() && keep)return ret;
      if(ret.getBondOrder()!==2 && ret.getBondOrder()!==1)return ret.setBondGeometry(0);
      if(ret.getBondOrder()!==2)return ret;
      if(ret.getBondStereo()==JSChemify.CONSTANTS.BOND_STEREO_EITHER){
         return ret.setBondGeometry(0);
      }
      if(!order){
         order=(o)=>o;
      }
      if(typeof order === "object"){
         let oo=order;
         order = (o)=>oo[o];
      }
      let thisOrder=order(ret.getIndexInParent());
      let side1Bs=ret.getAtom1().getBonds()
                    .filter(bb=>bb.getBondOrder()===1)
                    .map(bb=>[order(bb.getIndexInParent()),bb])
                    .sort((a,b)=>a[0]-b[0])
                    .map(bb=>[bb[0],bb[1].setBondGeometryFromCoordinates(keep,order)]);
      let side2Bs=ret.getAtom2().getBonds()
                    .filter(bb=>bb.getBondOrder()===1)
                    .map(bb=>[order(bb.getIndexInParent()),bb])
                    .sort((a,b)=>a[0]-b[0])
                    .map(bb=>[bb[0],bb[1].setBondGeometryFromCoordinates(keep,order)]);
      if(side1Bs.length===0 || side2Bs.length===0){
         return ret.setBondGeometry(0);
      }
      let adj=1;
      if(side1Bs.length>1){
         let loc=1;
         if(side1Bs[0][0]>thisOrder)loc=loc*-1;
         if(side1Bs[0][1].getBondGeometry() === JSChemify.CONSTANTS.BOND_GEOM_UP){
            loc=loc*-1;
         }else if(side1Bs[0][1].getBondGeometry()===JSChemify.CONSTANTS.BOND_GEOM_DOWN){
            loc=loc*1;
         }else if(side1Bs[0][1].getBondGeometry()===0){
            loc=loc*-1;
            //not sure about this
            if(side1Bs[1][0]>thisOrder)loc=loc*-1;
            if(side1Bs[1][1].getBondGeometry() === JSChemify.CONSTANTS.BOND_GEOM_UP){
               loc=loc*-1;
            }else if(side1Bs[1][1].getBondGeometry()===JSChemify.CONSTANTS.BOND_GEOM_DOWN){
               loc=loc*1;
            }else{
               loc=0;
            }
         }
         adj=adj*loc;
      }else if(side1Bs.length===1){
         let loc=1;
         if(side1Bs[0][0]>thisOrder)loc=loc*-1;
         if(side1Bs[0][1].getBondGeometry()===JSChemify.CONSTANTS.BOND_GEOM_UP){
            loc=loc*-1;
         }else if(side1Bs[0][1].getBondGeometry()===JSChemify.CONSTANTS.BOND_GEOM_DOWN){
            loc=loc*1;
         }else{
            loc=loc*0;
         }
         adj=adj*loc;
      }
      if(adj===0)return ret.setBondGeometry(0);
      if(side2Bs.length>1){
         let loc=1;
         if(side2Bs[0][0]>thisOrder)loc=loc*-1;
         if(side2Bs[0][1].getBondGeometry() === JSChemify.CONSTANTS.BOND_GEOM_UP){
            loc=loc*-1;
         }else if(side2Bs[0][1].getBondGeometry()===JSChemify.CONSTANTS.BOND_GEOM_DOWN){
            loc=loc*1;
         }else if(side2Bs[0][1].getBondGeometry()===0){
            loc=loc*-1;
            //not sure about this
            if(side2Bs[1][0]>thisOrder)loc=loc*-1;
            if(side2Bs[1][1].getBondGeometry() === JSChemify.CONSTANTS.BOND_GEOM_UP){
               loc=loc*-1;
            }else if(side2Bs[1][1].getBondGeometry()===JSChemify.CONSTANTS.BOND_GEOM_DOWN){
               loc=loc*1;
            }else{
               loc=0;
            }
         }
         adj=adj*loc;
      }else if(side2Bs.length===1){
         let loc=1;
         if(side2Bs[0][0]>thisOrder)loc=loc*-1;
         if(side2Bs[0][1].getBondGeometry()===JSChemify.CONSTANTS.BOND_GEOM_UP){
            loc=loc*-1;
         }else if(side2Bs[0][1].getBondGeometry()===JSChemify.CONSTANTS.BOND_GEOM_DOWN){
            loc=loc*1;
         }else{
            loc=loc*0;
         }
         adj=adj*loc;
      }
      if(adj>0)return ret.setBondGeometry(JSChemify.CONSTANTS.BOND_GEOM_LOCAL_E);
      if(adj<0)return ret.setBondGeometry(JSChemify.CONSTANTS.BOND_GEOM_LOCAL_Z);
      return ret.setBondGeometry(0);
  };
  
  ret.setBondGeometryFromCoordinates=function(keep, order){
      
      if(ret.getBondGeometry() && keep)return ret;
     
      if(ret.getBondOrder()!==1 && ret.getBondOrder()!==2){
         return ret.setBondGeometry(0);
      }
      if(!order){
         order=(o)=>o;
      }
      if(typeof order === "object"){
         let oo=order;
         order = (o)=>oo[o];
      }
      let thisIndex=order(ret.getIndexInParent());
      let a1=ret.getAtom1();
      let a2=ret.getAtom2();
      let vec=JSChemify.Util.normVector(a1.getVectorTo(a2));
      let indexes=[];
     
      let rej1=ret.getAtom1().getNeighborAtomsAndBonds()
                    .filter(bb=>bb.atom!==a2)
                    .filter(bb=>bb.bond.getBondOrder()===2)
                    .filter(bb=>bb.bond.getBondStereo()!==JSChemify.CONSTANTS.BOND_STEREO_EITHER)
                    .filter(bb=>{
                        let size=bb.bond.getSmallestRingSize();
                        if(size>0 && size<8)return false;
                        if(bb.atom.getBonds().length<=1)return false;
                        return true;
                    })
                    .map(bb=>{
                        let oIndex=order(bb.bond.getIndexInParent());
                        indexes[0]=oIndex;
                        let adj=1;
                        if(oIndex>thisIndex)adj=adj*-1;
                        let ovec=JSChemify.Util.normVector(bb.bond.getDeltaVector());
                        let rej=(vec[0]*ovec[1]-vec[1]*ovec[0]);
                        return adj*rej;
                    });
      let rej2=ret.getAtom2().getNeighborAtomsAndBonds()
                    .filter(bb=>bb.atom!==a1)
                    .filter(bb=>bb.bond.getBondOrder()===2)
                    .filter(bb=>bb.bond.getBondStereo()!==JSChemify.CONSTANTS.BOND_STEREO_EITHER)
                    .filter(bb=>{
                        let size=bb.bond.getSmallestRingSize();
                        if(size>0 && size<8)return false;
                        if(bb.atom.getBonds().length<=1)return false;
                        return true;
                    })
                    .map(bb=>{
                        let oIndex=order(bb.bond.getIndexInParent());
                        indexes[1]=oIndex;
                        let adj=1;
                        if(oIndex>thisIndex)adj=adj*-1;
                        let ovec=JSChemify.Util.normVector(bb.bond.getDeltaVector());
                        let rej=vec[0]*ovec[1]-vec[1]*ovec[0];
                        return adj*rej;
                    });
      if(rej1.length===1 && rej2.length===0){
         if(rej1[0]>JSChemify.CONSTANTS.BOND_REJECTION_ZERO_TOLERANCE){
            return ret.setBondGeometry(JSChemify.CONSTANTS.BOND_GEOM_UP);
         }else if(rej1[0]<-JSChemify.CONSTANTS.BOND_REJECTION_ZERO_TOLERANCE){
            return ret.setBondGeometry(JSChemify.CONSTANTS.BOND_GEOM_DOWN);
         }
      }else if(rej2.length===1 && rej1.length===0){
         if(rej2[0]>JSChemify.CONSTANTS.BOND_REJECTION_ZERO_TOLERANCE){
            return ret.setBondGeometry(JSChemify.CONSTANTS.BOND_GEOM_DOWN);
         }else if(rej2[0]<-JSChemify.CONSTANTS.BOND_REJECTION_ZERO_TOLERANCE){
            return ret.setBondGeometry(JSChemify.CONSTANTS.BOND_GEOM_UP);
         }
      }else if(rej1.length===1 && rej2.length===1){
         //TODO: need to consider this kind of case ... 
         //the thing that matters is relative stuff
         //probably prioritize the lower one
         let uRej=rej1;
         let adj=1;
         if(indexes[0]<indexes[1]){
            adj=adj*-1;
            uRej=rej2;
         }
         if(uRej[0]*adj>0){
            return ret.setBondGeometry(JSChemify.CONSTANTS.BOND_GEOM_DOWN);
         }else if(uRej[0]*adj<0){
            return ret.setBondGeometry(JSChemify.CONSTANTS.BOND_GEOM_UP);
         }
      }
      
      return ret.setBondGeometry(0);
  };
  
  ret.hasAtom=function(a){
     return ret.getAtoms().indexOf(a)>=0;
  };
  ret.setCoordinatesFromPathNotation=function(path,ovec,a){
      let nvec=JSChemify.PathNotation().deltaVectorFromPath(path);
      
      let nat=ret.getOtherAtom(a);
      let oldpt=a.getPoint();
      let pvec=[-ovec[1],ovec[0]];
      let wedge=path[2];
      if(wedge){
        let wlow=wedge.toLowerCase();
        let par=1;
         
        if(wedge===wedge.toLowerCase()){
          par=par*-1;
        }
        //not entirely sure about this one
        if(ret._atom1!==a){
          par=par*-1;
        }
        if(par<0){
          ret.swap();
        }
        
        if(wlow==="h"){
          ret.setBondStereo(JSChemify.CONSTANTS.BOND_STEREO_DASH);
        }else if(wlow==="w"){
          ret.setBondStereo(JSChemify.CONSTANTS.BOND_STEREO_WEDGE);
        }else if(wlow==="e"){
          ret.setBondStereo(JSChemify.CONSTANTS.BOND_STEREO_EITHER);
        }
      }
        
      let nnvec=[ovec[0]*nvec[0]+pvec[0]*nvec[1],ovec[1]*nvec[0]+pvec[1]*nvec[1]];
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
        }else if(bs===JSChemify.CONSTANTS.BOND_STEREO_EITHER){
          wedge="E";
        }
        if(ret._atom1!==a && ret.getBondOrder()===1){
          //TODO: come back to this
          wedge=wedge.toLowerCase();
        }
     }
     let pn= JSChemify.PathNotation()
                      .pathFromDeltaVector(vec1,vec2);
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
        }else if(bs===JSChemify.CONSTANTS.BOND_STEREO_EITHER){
          wedge="E";
        }
        if(b._atom1!==a && b.getBondOrder()===1){
          //TODO: come back to this
          wedge=wedge.toLowerCase();
        }
     }
     let pn= JSChemify.PathNotation().pathFromDeltaVector(vec1,vec2);
     if(wedge){
        pn.push(wedge);
     }
     return pn;
  };
  
  ret.swap=function(){
      let t=ret._atom1;
      ret._atom1=ret._atom2;
      ret._atom2=t;
  };
  
  ret.getSmallestRingSize=function(){
      if(ret.$smallestRingSize==null || 
       ret.getParent().$dirtyNumber()!==ret.$dirty){
      let rings=ret.getParent().getRings();
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
    let rsize=ret.getSmallestRingSize();
    return ret.getParent().getRings()
       .filter(r=>r.hasBond(ret))
       .filter(r=>r.getSize()===rsize);
  };
  
  ret.getParent=function(){
      return ret._parent;
  };
  
  ret.getCenterPoint=function(){
    let cpt=ret.getAtoms()
               .map(at=>[at.getX(),at.getY(),1])
               .reduce((a,b)=>JSChemify.Util.addVector(a,b));
    cpt[0]=cpt[0]/cpt[2];
    cpt[1]=cpt[1]/cpt[2];
    cpt.pop();
    return cpt;
  };
  
  ret.getIndexInParent=function(){
      if(ret.$indexInParent===null || 
         ret.getParent().$dirtyNumber()!==ret.$dirty){
        ret.$dirty=ret.getParent().$dirtyNumber();
        ret.$indexInParent=ret.getParent()
                              .getIndexOf(ret);
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
    let aindex1= line.substr(0,3).trim()-1;
    let aindex2= line.substr(3,3).trim()-1;
    let order= line.substr(6,3).trim()-0;
    let stereo= line.substr(9,3).trim()-0;
    return ret.setBond(aindex1,aindex2,order,stereo);
  };
  
  ret.toSmiles=function(force){
    //TODO: Deal with stereo
    if(ret._order==1){
        if(ret._geom ===JSChemify.CONSTANTS.BOND_GEOM_UP){
            return "/";
        }else if(ret._geom ===JSChemify.CONSTANTS.BOND_GEOM_DOWN){
            return "\\";
        }
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
  let ret={};
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
      
  ret._annotations=null;
  
  
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
      
    let atomSet=[];
    let firstRing = null;
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
    let stack = firstRing.getNeighborRingsAndBonds().map(nn=>nn);
    
    while(stack.length>0){
      let nRingConnection = stack.pop();
      let newRing = nRingConnection.ring;
      //If the new ring has unassiged atoms, process it.
      //otherwise continue down the stack
      if(newRing.getAtoms().findIndex(aa=>atomSet.indexOf(aa)<0)>=0){
        let oldRing = nRingConnection.bond.getOtherRing(newRing);
        let bridgeHeads = nRingConnection.bond.getBridgeHeads();
        let delta=null;
        let direction=1;
        let internalDelta=false;
        let centerVec = bridgeHeads[0].getVectorToPoint(oldRing.getCenterPoint());
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
        let gInv=ret.getGraphInvariant();
        ret.$adjustableAtoms=ret.getAtoms()
         .filter(at=>!at.isInRing()) //TODO:maybe keep some?
         .filter(at=>at.getBonds().length>=2);
         /*
         .filter(at=>{
            let counts=at.getNeighborAtomsAndBonds()
              .map(n=>gInv[n.atom.getIndexInParent()])
              .map(v=>{
                  let m={};
                m[v]=1;
                return m;
              }).reduce((a,b)=>{
                  Object.keys(b).map(bk=>{
                    if(!a[bk])a[bk]=0;
                    a[bk]=b[bk]+a[bk];
                });""
                return a;
              });
              let uniq = Object.values(counts);
              
            return Object.values(counts).findIndex(c=>c>1)<0;
         });
         */
    }
    return ret.$adjustableAtoms;
  };
  //TODO: Speed up
  ret.clone=function(){
    let nchem = JSChemify.Chemical();
    nchem.setName(ret.getName());
    nchem._properties=
        JSON.parse(JSON.stringify(ret._properties));
    let bds=[];
    ret.getAtoms()
         .map((a,i)=>{
                 let nat=nchem.addAtom(a.clone());
              bds[i]=nat;
         });
    ret.getBonds()
        .map(b=>{
          let at1=bds[b._atom1.getIndexInParent()];
          let at2=bds[b._atom2.getIndexInParent()];

          let nbd=b.clone();
          nbd._atom1=at1;
          nbd._atom2=at2;
          nchem.addBond(nbd);

        });
     ret.getSGroups()
        .map(sg=>{
            let cln = sg.clone();
           
            cln.setAtoms(cln.getAtoms().map(a=>bds[a.getIndexInParent()]));
            cln.setDisplayAtoms(cln.getDisplayAtoms().map(a=>bds[a.getIndexInParent()]));
            let cbonds=cln.getCrossBonds().map(b=>nchem.getBond(b.getIndexInParent()));
            cln.setCrossBonds(cbonds);
            cln.setParent(nchem);
            nchem.addSGroup(cln);
           
        })
        
     nchem.setAnnotations(ret.getAnnotations());
           
     return nchem;
  };
  
  //TODO:Need a way to orient things here
  ret.$hexRingPath=function(s){
        let start="RLRRRLRRRLRR";
      if(s<12)return start;
      if(s>=12 && s<=16){
        let c=12;
        while(s>c){
          start=start.replace(/RRLRR/,"RLRRRLR");
          c+=2;
        }
      }else{
           let c=18;
          start="LRRLRRLRRLRRLRRLRR";
        while(s>c){
          start=start.replace(/RRLRR/,"RLRRRLR");
          c+=2;
        }
      }
      return start;
  };
    
  ret.$ringCoordinates=function(ring,satom,eatom,delta,internalDelta,direction){
      
    let ratoms = ring.getAtoms();
    let ai=0;
    let acountAng=ratoms.length;
    let acountSet=ratoms.length;
    let rev=false;
    if(!satom){
        satom=ratoms[0];
    }else{
        ai=ratoms.findIndex(at=>at===satom);
    }
    if(eatom){
        let eIndex= ratoms.findIndex(at=>at===eatom);
      //[A,B,C,D,E,F]
      //Imagine start is D, end is E
      let difference1 = ai-eIndex;             //3-4 =-1   1
      let difference2 = difference1+acountAng; //9-4 = 5   7
      if(difference1>0){
          difference2 = difference1-acountAng;  //-3-4=-7  -5
      }
      //find the largest path
      let dist = (Math.abs(difference1)>Math.abs(difference2))?
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
    
    let ang=Math.PI*2/acountAng;
    let outsideAng=Math.PI*2-ang;
    
    let adj =[Math.cos(ang), Math.sin(ang)];
    let adjHalf=[Math.cos(outsideAng/2), Math.sin(outsideAng/2)];
    
    let deltaR =[Math.cos(Math.PI/3), 
                              Math.sin(Math.PI/3)];
                  
    let deltaL =[Math.cos(-Math.PI/3), 
                              Math.sin(-Math.PI/3)];
    
    if(direction && direction<0){
        adj[1]=-adj[1];
      adjHalf[1]=-adjHalf[1];
      let t=deltaR;
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
    let path=ret.$hexRingPath(acountSet);
    
    let lastPoint=[satom.getX(),satom.getY()];
   // satom.setXYZ(lastPoint[0],lastPoint[1]);
    if(!internalDelta){    
      let ndelta=[-delta[1],delta[0]];
      delta=[
        -adjHalf[0]*ndelta[0] - adjHalf[1]*ndelta[1],
         adjHalf[1]*ndelta[0] - adjHalf[0]*ndelta[1]
      ];
    }
    for(var i=1;i<acountSet;i++){
        let ni=(ai+i)%ratoms.length;
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
    let BASIS=JSChemify.CONSTANTS.VECTORS_BASIS;
    
    
    let bangles =BASIS.bangles;
    let altBangles=BASIS.altBangles;       
    let altBanglesR=BASIS.altBanglesR;            
    
    let satom= ret.getAtom(ai);
    if(!cursor){
        cursor=[satom.getX(),satom.getY()];
    }else{
        satom.setXYZ(cursor[0],cursor[1]);
    }
    
    if(cb){
        cb(satom);
    }
    
    let emptyOrigin=false;
    //var delta=[Math.cos(Math.PI/6),-Math.sin(Math.PI/6)];
    if(!delta){
      delta=[-BASIS.up[1],BASIS.up[0]];
      emptyOrigin=true;
    }
    
    let stackCursor=[];
    let stackDelta=[];
    let stackParity=[];
    let stackBnums=[];
    let parity=0;
    let bnum=0;
    let gInv=ret.getGraphInvariant();
    
    let justPopped=false;
    satom.$allPathsDepthFirst((p,t)=>{
           let tbond =p[p.length-1];
      
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
        
         let ndelta;
         if(bnum==2 && p.length<=2 && emptyOrigin){
             ndelta=[-delta[0],-delta[1]];
           bnum--;
           emptyOrigin=false;
         }else{
           let buse=bangles;
           let special=false;
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
            
           let bang = buse[parity][bnum];
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
        let newAtom = p[p.length-1];
        newAtom.atom.setXYZ(cursor[0],cursor[1]);
        if(cb){
          cb(newAtom.atom);
        }
        //bnum=0;
        //parity=(parity+1)%2;
        
      }
    },null,true, (a,b)=>{
        let ss= gInv[a.atom.getIndexInParent()]-gInv[b.atom.getIndexInParent()];
      
        
      return ss;
    });
    return ret;
    
  };

  ret.transformCoordinates=function(m){
    let basis1=m[0];
    let basis2=m[1];
    ret.getAtoms().map(at=>{
            let x=at.getX();
            let y=at.getY();
        let dot1=x*basis1[0]+y*basis1[1];
        let dot2=x*basis2[0]+y*basis2[1];
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
     let startAtom=ret.getAtom(0);
     let got={};
     let gotAtoms={};
     let pthIndex=0;
     let startDx=Math.cos((360/150)*Math.PI);
     let startDy=Math.sin((360/150)*Math.PI);
     let sgroupLookup={};
     let sgroupStack=[];
     let csgroup=null;
     
     while(startAtom){
        let comp={};
        gotAtoms[startAtom.getIndexInParent()]=true;
        comp[startAtom.getIndexInParent()]=true;
        let sgroupStart=false;
        if(pn[pthIndex] && pn[pthIndex][0].startsWith(",[")){
           pthIndex++;
           sgroupStart=true;
        }
        closedRings=[];
        startAtom.$allPathsDepthFirst((path)=>{
             let nnbondIdx=path[path.length-1].bond.getIndexInParent();
             if(got[nnbondIdx]){
               return true;
             } 
             if(pn[pthIndex][0]==="["){
               if(csgroup){
                  sgroupStack.push(csgroup);
               }
               csgroup=ret.addNewSGroup()
                          .setType("SRU")
                          .addCrossBond(ret.getBond(nnbondIdx));
                
               pthIndex++;
             }
             if(pn[pthIndex][0][0]==="]"){
                let lab=pn[pthIndex][0].substr(2).replace(")","");
                
                csgroup.setLabel(lab)
                       .addCrossBond(ret.getBond(nnbondIdx))
                       .setAtomsFromCrossBonds();
                if(sgroupStack.length>0){
                   csgroup=sgroupStack.pop();
                }else{
                   csgroup=null;
                }
                pthIndex++;  
             }

             let newAtom = path[path.length-1];
             if(closedRings.findIndex(cr=>cr.bond ===newAtom.bond)>=0){
                  return true;
             }
           
             let atom1=path[path.length-2].atom;
             gotAtoms[atom1.getIndexInParent()]=true;
             comp[atom1.getIndexInParent()]=true;
             if(path.length>2){
                
               let atom2=path[path.length-1].atom;
               gotAtoms[atom2.getIndexInParent()]=true;
               comp[atom2.getIndexInParent()]=true;
               let pth=pn[pthIndex];
               pthIndex++;
               let obond=path[path.length-2].bond;
               let nbond=path[path.length-1].bond;
               let satom=path[path.length-2].atom;
               let ovec = obond.getOtherAtom(satom).getVectorTo(satom);
               nbond.setCoordinatesFromPathNotation(pth,ovec,satom);
               
             }else if(path.length===2){
               let pth=pn[pthIndex];
               pthIndex++;
               let bond=path[path.length-1].bond;
               let satom=path[path.length-1].atom;
               let datom=bond.getOtherAtom(satom);
               bond.setCoordinatesFromPathNotation(pth,[startDx,startDy],datom);
             }
             got[path[path.length-1].bond.getIndexInParent()]=true;



               
               let rindx=path.findIndex(pa=>pa.atom===newAtom.atom);
               if(rindx<path.length-1){
                  closedRings.push(newAtom);
                  return true;
               }
           
            });
        if(pn[pthIndex] && pn[pthIndex][0][0]==="]"){
           let brack= pn[pthIndex][0];
           if(brack[1]==="M"){
               let grp=brack.substr(2);
               let rgrp=sgroupLookup[grp];
               if(!rgrp){
                   rgrp=ret.addNewSGroup()
                           .setType("MUL")
                           .setLabel(0);
                   sgroupLookup[grp]=rgrp;
                   Object.keys(comp)
                         .map(ai=>ret.getAtom(ai))
                         .map(aa=>rgrp.addDisplayAtom(aa));
               }
               Object.keys(comp)
                         .map(ai=>ret.getAtom(ai))
                         .map(aa=>rgrp.addAtom(aa));
              rgrp.setLabel(rgrp.getLabel()-0+1);
           }
           pthIndex++;
        }
        
           
        let latom=startAtom;
        startAtom=null;
        for(let i=0;i<ret.getAtomCount();i++){
            if(!gotAtoms[i]){
               startAtom=ret.getAtom(i);
               break;
            }
        }
        if(startAtom){
            if(pn[pthIndex][0].startsWith(",[")){
               pthIndex++;
               sgroupStart=true;
            }
            let pdx=startDx;
            let pdy=startDy;
            let pth=pn[pthIndex];
            pthIndex++;
           
            let nvec=JSChemify.PathNotation()
                              .deltaVectorFromPath(pth);
           
            let ovec=[pdx,pdy];
           
            let pvec=[-ovec[1],ovec[0]];
            let nnvec=[ovec[0]*nvec[0]+pvec[0]*nvec[1],
                       ovec[1]*nvec[0]+pvec[1]*nvec[1]];
            startAtom.setXYZ(latom.getX()+nnvec[0],latom.getY()+nnvec[1]);
            let dvec=latom.getVectorTo(startAtom);
            startDx=dvec[0];
            startDy=dvec[1];
            
            startDx=Math.cos((360/150)*Math.PI);
            startDy=Math.sin((360/150)*Math.PI);
        }
     }

     return ret;
  };

  ret.getAtomOverlapRMSE=function(c2, normFirst){
     let atoms1=JSChemify.Util.distinct(ret.getSmilesAtomBondOrder().map(p=>p.atom));
     let atoms2=JSChemify.Util.distinct(c2.getSmilesAtomBondOrder().map(p=>p.atom));

     let avgBL1=ret.getAverageBondLength();
     let avgBL2=c2.getAverageBondLength();
     
     let affine=JSChemify.AffineTransformation();
     if(normFirst){
         let bbox1=ret.getBoundingBox();
         let bbox2=c2.getBoundingBox();
         let cc1=[ (bbox1[2]+bbox1[0])/2,
                 (bbox1[3]+bbox1[1])/2];
         let cc2=[ (bbox2[2]+bbox2[0])/2,
                 (bbox2[3]+bbox2[1])/2];
         affine=JSChemify.AffineTransformation()
              .translate(cc1[0],cc1[1])
              .scale(avgBL1/avgBL2,avgBL1/avgBL2)
              .translate(-cc2[0],-cc2[1]);
     }
     
     let sum=0;
     for(let i=0;i<atoms1.length;i++){
         let pt=affine.transform(atoms2[i].getPoint());
         let vec=atoms1[i].getVectorToPoint(pt);
         let err=JSChemify.Util.sqMagVector(vec)/(avgBL1*avgBL1);
         sum+=err;
     }
     sum=sum/atoms1.length;
     return Math.sqrt(sum);
     
  };
   
  ret.getSmilesAtomBondOrder=function(){
     let startAtom=ret.getAtom(0);
     let gotAtoms={};
     let got={};
     let stack=[];

     while(startAtom){
        gotAtoms[startAtom.getIndexInParent()]=true;
        closedRings=[];
        startAtom.$allPathsDepthFirst((path)=>{
           let nnbondIdx=path[path.length-1].bond.getIndexInParent();
           if(got[nnbondIdx]){
             return true;
           }
           let atom1=path[path.length-2].atom;
           gotAtoms[atom1.getIndexInParent()]=true;

           
           let newAtom = path[path.length-1];
           if(closedRings.findIndex(cr=>cr.bond ===newAtom.bond)>=0){
                return true;
           }
           
           if(path.length>2){
             let atom2=path[path.length-1].atom;
             gotAtoms[atom2.getIndexInParent()]=true;
             stack.push(path[path.length-1]);
           }else if(path.length===2){
             stack.push(path[0]);
           }
           stack.push(path[path.length-1]);
           got[path[path.length-1].bond.getIndexInParent()]=true;
            let rindx=path.findIndex(pa=>pa.atom===newAtom.atom);
            if(rindx<path.length-1){
               closedRings.push(newAtom);
               return true;
            }
        });

        let latom=startAtom;
        startAtom=null;
        for(let i=0;i<ret.getAtomCount();i++){
            if(!gotAtoms[i]){
               startAtom=ret.getAtom(i);
               break;
            }
        }
     }
     return stack;
  };
  ret.getPathNotation=function(){
     let startAtom=ret.getAtom(0);
     let dpath=[];
     let gotAtoms={};
     let got={};
     let startDx=Math.cos((360/150)*Math.PI);
     let startDy=Math.sin((360/150)*Math.PI);
     let mgroupIndexes=[];
     let crossBondSIndex={};
     
     ret.getSGroups()
         .map(sg=>[sg,sg.getCrossBonds()])
         .filter(ar=>ar[1].length===2)
         .map(ar=>{
            crossBondSIndex[ar[1][0].getIndexInParent()] = ar[0];
            crossBondSIndex[ar[1][1].getIndexInParent()] = ar[0];
         });

     let sgroupsOpen={};
     
     let startPathIndex=dpath.length;
     while(startAtom){
        let comp={};
        gotAtoms[startAtom.getIndexInParent()]=true;
        comp[startAtom.getIndexInParent()]=true;
        closedRings=[];
        startAtom.$allPathsDepthFirst((path)=>{
           
           let nnbondIdx=path[path.length-1].bond.getIndexInParent();
           
           if(got[nnbondIdx]){
             return true;
           } 
           let bsgroup=crossBondSIndex[nnbondIdx];

           if(bsgroup){
               if(sgroupsOpen[bsgroup.getIndex()]){
                  let lab=bsgroup.getLabel();
                  dpath.push(["](" + lab + ")"]);
               }else{
                  sgroupsOpen[bsgroup.getIndex()]=true;
                  dpath.push(["["]);
               }
           }
           
           let atom1=path[path.length-2].atom;
           gotAtoms[atom1.getIndexInParent()]=true;
           comp[atom1.getIndexInParent()]=true;

           
           let newAtom = path[path.length-1];
           if(closedRings.findIndex(cr=>cr.bond ===newAtom.bond)>=0){
                return true;
           }
           
           if(path.length>2){
             let atom2=path[path.length-1].atom;
             gotAtoms[atom2.getIndexInParent()]=true;
             comp[atom2.getIndexInParent()]=true;
             let obond=path[path.length-2].bond;
             let nbond=path[path.length-1].bond;
             let satom=path[path.length-2].atom;
             dpath.push(obond.pathNotationDirectionTo(nbond,satom));
           }else if(path.length===2){
             let nn=path[path.length-1].bond.pathNotationDirectionFrom(startDx,startDy,path[0].atom);
             dpath.push(nn);
           }
           got[path[path.length-1].bond.getIndexInParent()]=true;

          
            let rindx=path.findIndex(pa=>pa.atom===newAtom.atom);
            if(rindx<path.length-1){
               closedRings.push(newAtom);
               return true;
            }
        });

        let sgroups =ret.getSGroups()
           .filter(sg=>sg.getType()==="MUL")
           .filter(sg=>Object.keys(comp)
                             .map(ai=>ret.getAtom(ai))
              //find a case where it doesn't have this 
              //atom
                       .findIndex(aa=>!sg.hasAtom(aa))<0);
        //only consider cases where there's 1 MUL group
        if(sgroups.length===1){
          let mgroup=sgroups[0];
          let gindex=mgroup.getIndex();
          let aindex=0;
          let oindex=mgroupIndexes.indexOf(gindex);
          if(oindex<0){
            mgroupIndexes.push(gindex);
            aindex=mgroupIndexes.length;
          }else{
            aindex=oindex+1;
          }
          dpath.splice(startPathIndex, 0, [",["]);
          dpath.push(["]M" + aindex]); 
        }
        startPathIndex=dpath.length;
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
            
            
            startDx=Math.cos((360/150)*Math.PI);
            startDy=Math.sin((360/150)*Math.PI);
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
    ret.getBonds().map(bb=>bb.setDoubleBondLocalGeometry(true));
    let bondGeo={};
    ret.getBonds().filter(bb=>bb.getBondOrder()===2)
                  .map(bb=>bondGeo[bb.getIndexInParent()]=bb.getBondGeometry());
    if(ret.getComponentCount()>1){
       let comps=ret.getComponents();
       comps.map(cc=>cc.generateCoordinates());
       //TODO determine best grid layout and whether
       //to have ionic moieties show near their 
       //counter ions?
       let offsets=[];
       let padding=1.5;
       offsets.push([0,0]);
       let lastBbox=comps[0].getBoundingBox();
       let lastC=[(lastBbox[0]+lastBbox[2])/2,
                  (lastBbox[1]+lastBbox[3])/2];
       //vector which points to the center
       let lastV=[(lastBbox[2]-lastBbox[0])/2,
                  (lastBbox[3]-lastBbox[1])/2];
       for(let i=1;i<comps.length;i++){
           let bbox=comps[i].getBoundingBox();
           let c=[(bbox[0]+bbox[2])/2,
                  (bbox[1]+bbox[3])/2];
           let v=[(bbox[2]-bbox[0])/2,
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
       
       ret.getAtoms().map(a=>a.setStereoBondFromParity());
       ret.getSGroups().map(sg=>{
         sg.resetBracketLocation();
       });
       return ret;
    }
     
    let atomSet=[];
    let natoms=[];
    let ringSystems=ret.getRingSystems();
    let lRingSystem=null;
    if(ringSystems.length>0){
        
      let rs1= ringSystems[0];
      if(ringSystems.length>1){
        rs1= ringSystems.reduce((a,b)=>{
          if(a.getSize()>b.getSize())return a;
          return b;
        });
      }
      lRingSystem=rs1;
      let startAtom=null;
      let rdelta=null;
      
      while(rs1){
      rs1.getAtoms().map(a=>atomSet.push(a));
      ret.$ringSystemCoordinates(rs1,startAtom,rdelta);
      
      //ret.$ringCoordinates=function(ring,ai,delta, catomXYZ){
  
      rs1.getExternalBonds()
        .map(eb=>{
            if(atomSet.indexOf(eb.bond.getOtherAtom(eb.atom))>=0)return;
            let gbonds=[];
            let delta=eb.atom.getLeastOccupiedVector((na)=>{
                if(atomSet.indexOf(na.atom)>=0){
                  return true;
                }else{
                  gbonds.push(na);
                  return false;
                }
            });

            //Single connection to ring
            if(gbonds.length===1){
              let oat=gbonds[0].atom;
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
           let co=startAtom.getLeastOccupiedVector(nb=>!nb.bond.isInRing());
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
    //now fix E/Z stuff
    ret.getBonds().map(bb=>bb.setDoubleBondLocalGeometry(false));
    ret.getBonds().filter(bb=>bb.getBondOrder()===2)
                  .map(bb=>{
                     
                     let oldGeo=bondGeo[bb.getIndexInParent()];
                     let newGeo=bb.getBondGeometry();
                     if(oldGeo===newGeo)return;
                     //make 
                     if(oldGeo===0 && newGeo!==0){
                         //
                         //bb.setBondStereo(JSChemify.CONSTANTS.BOND_STEREO_EITHER);
                         bb.setBondGeometry(0);

                         let fixed=false;
                         if(bb.isInRing()){
                            if(bb.getAtom1().getBondCount()===2 && bb.getAtom2().getBondCount()===2){
                               let oat1=bb.getAtom1()
                                   .getBonds()
                                   .filter(b2=>b2!==bb)
                                   .map(b2=>b2.getOtherAtom(bb.getAtom1()))[0];
                               let oat2=bb.getAtom2()
                                   .getBonds()
                                   .filter(b2=>b2!==bb)
                                   .map(b2=>b2.getOtherAtom(bb.getAtom2()))[0];
                               let dvec=oat1.getVectorTo(oat2);
                               let pt=oat1.getPoint();
                               bb.getAtom1().setXYZ(pt[0]+dvec[0]/3,pt[1]+dvec[1]/3);
                               bb.getAtom2().setXYZ(pt[0]+2*dvec[0]/3,pt[1]+2*dvec[1]/3);
                               fixed=true;
                            } else if(bb.getAtom1().getBondCount()===2 || bb.getAtom2().getBondCount()===2){
                               let gend=bb.getAtom1();
                               if(bb.getAtom2().getBondCount()===2)gend=bb.getAtom2();
                               let oat2=bb.getOtherAtom(gend);
                               let nat=gend.getBonds()
                                   .filter(b2=>b2!==bb)
                                   .map(b2=>b2.getOtherAtom(gend))[0];
                               let dvec=nat.getVectorTo(oat2);
                               let pt=nat.getPoint();
                               gend.setXYZ(pt[0]+dvec[0]/2,pt[1]+dvec[1]/2);
                               fixed=true;
                            }
                         }else if(bb.getAtom1().getBondCount()===2 || bb.getAtom2().getBondCount()===2){
                            bb.getAtoms()
                              .filter(aa=>aa.getBondCount()===2)
                              .map(aa=>{
                                 let a2=bb.getOtherAtom(aa);
                                 aa.swapSubstituentCoordinates(aa.getBonds()
                                                                 .filter(b2=>b2!==bb)[0],null,aa.getVectorTo(a2));
                              });
                            fixed=true;
                         }
                         
                         if(!fixed){
                            //console.log("Not fixed");
                            //Need a better way to do this. Also need a setting
                            //to turn on/off
                            bb.setBondStereo(JSChemify.CONSTANTS.BOND_STEREO_EITHER);
                         }
                        
                     }else if(oldGeo!==0 && newGeo!==0){
                        //different
                        //need to swap
                        let tarAtom=bb.getAtom1();
                        if(bb.getAtom1().getBondCount()>bb.getAtom2().getBondCount()){
                           tarAtom=bb.getAtom2();
                        }
                        let oAtom=bb.getOtherAtom(tarAtom);
                        if(!bb.isInRing()){
                           //easy case ... kinda
                           //need to swap the substituents
                           let bds=tarAtom.getBonds().filter(b2=>b2!==bb);
                           tarAtom.swapSubstituentCoordinates(bds[0],bds[1]);
                        }else{
                           //TODO implement this. It's actually a little hard to do
                           //right
                        }
                        bb.setDoubleBondLocalGeometry(false);
                     }
                  });
    
    
    //Now do final adjustments
    if(lRingSystem){
      let fused =lRingSystem.getRingBonds()
                            .filter(rb=>rb.getBonds().length===1);
      let centerPt=lRingSystem.getCenterPoint();
        
      if(fused.length>1){
          let sumR=fused.map(f=>f.getRings()
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
                     let bb = f.getBonds()[0];
                     let bpt=bb.getCenterPoint();
                     let dd=JSChemify.Util.sqDist(bpt,centerPt);
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
        let bb=fused[0].getBonds()[0];
        let vec=bb.getAtoms()[1].getVectorTo(bb.getAtoms()[0]);
        let dot1=vec[0];
        let dot2=vec[1];
        let rej1=Math.sqrt()
        let trans=[
        [-dot2,dot1],
        [dot1,dot2]
        ];
        
        let nvec=[trans[0][0]*vec[0]+trans[0][1]*vec[1],
                             trans[1][0]*vec[0]+trans[1][1]*vec[1]];
        ret.transformCoordinates(trans);
        
        //TODO do better with dirtiness
        lRingSystem.$center=null;
        lRingSystem.getRings().map(rr=>rr.$center=null);
      }     
      
      //Now decide if we flip it horizontally
      let flipHorizontal=1;
      let flipVertical=1;
      centerPt=lRingSystem.getCenterPoint();
      let smallestRingCenter = lRingSystem.getRings().reduce((a,b)=>{
        if(a.getSize()<b.getSize())return a;
        return b;
        }).getCenterPoint();
      if(smallestRingCenter[0]<centerPt[0])flipHorizontal=-1;
      if(smallestRingCenter[1]<centerPt[1])flipVertical=-1;
      if(flipHorizontal + flipVertical<2){
        let trans=[
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

    let isDebug=false;
    let debug=0;
    let maxdebug=200;
    //This will look if some atoms are too close
    let clusters=ret.$getCloseClustersOfAtoms();
    //clusters=[];
    if(clusters.length>0){
      let iters=0;
      let MAX_ITERS=20;

      
      while(clusters.length>0){
        if(iters>MAX_ITERS)break;
        iters++;
        let adjAtoms=ret.getLayoutAdjustableAtoms();
        let cluster1=clusters.pop();
        let atom1=cluster1[0];
        let atom2=cluster1[1];
        adjAtoms.sort((a,b)=>{
            let diff=a.getBondCount()-b.getBondCount();
            if(diff!==0)return diff;
            let d1a=a.getShortestAtomDistance(atom1);
            let d2a=a.getShortestAtomDistance(atom2);
            let d1b=b.getShortestAtomDistance(atom1);
            let d2b=b.getShortestAtomDistance(atom2);
            if(Math.min(d1a,d2a)<Math.min(d1b,d2b)){
                return -1;
            }
            return 1;
        });
        let breakOut=false;
        for(var i=0;i<adjAtoms.length;i++){
          if(breakOut)break;
          let aatom=adjAtoms[i];
          let network=aatom.getConnectedNetworkAndBonds();
          let net1=network.find(bn=>{
              return bn.network[atom1.getIndexInParent()];
          });
          let net2=network.find(bn=>{
              return bn.network[atom2.getIndexInParent()];
          });
          let othernets = network.filter(nn=>nn!==net1 && nn!==net2);
          //TODO: consider the following:
          // 1. Rotate the blocking group to the area with most space
          //    if it were not present
          // 2. Extend the blocking group bond length
          // 3. wiggle the atoms so that the convex hull isn't
          //    intersecting anymore
          // None of these are done at the moment
          
          if(net1!==net2 && (net1) && (net2)){
             debug++;
            let nlist=[net1,net2];
            for(var ii=0;ii<nlist.length;ii++){
              if(breakOut)break;
              let smallerNet=nlist[ii];
              let nvecs=[];
  
              if(aatom.getBonds().length===2){
                nvecs.push({"net":null, "vec":(()=>{
                   let rrvec=aatom.getVectorAwayFromNeighborCenters();
                   return rrvec;
                   })});
              }else{
                othernets.map(on=>{
                  let cAtom = on.bond.getOtherAtom(aatom);
                  nvecs.push({"net":on, "vec":(()=>aatom.getVectorTo(cAtom))});
                })
              }
              if(isDebug){
                ret.getAtoms().map(a=>a.setAtomMap(0));
              }
              while(nvecs.length>0){
                let nvecT=nvecs.pop();
                let nvec=nvecT.vec();
  
                let ovec=aatom.getVectorTo(smallerNet.bond.getOtherAtom(aatom));
                let cVec=[aatom.getX(),aatom.getY()];
                let mat=JSChemify.Util.getTransformFromVectorToVector(ovec,nvec);
                let revmat=JSChemify.Util.getTransformFromVectorToVector(nvec,ovec);
                let oldXY=ret.getAtoms().map(a=>[a.getX(),a.getY()]);
                let vecs=Object.keys(smallerNet.network)
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
                if(nvecT.net){
                  let vecs2=Object.keys(nvecT.net.network)
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
                let nclusters=ret.$getCloseClustersOfAtoms();
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
      let blab = ret.getAtoms().map(a=>a.getBondCount());
      let blab2 = blab.map(b=>b);
      let tucount=0;
      for(var i=0;i<ret.getAtomCount();i++){
        let mult=1;

        for(var j=0;j<ret.getAtomCount();j++){
          let nm = ret.getAtom(j)
             .getNeighborAtomsAndBonds()
             .map(n=>n.atom.getIndexInParent())
             .map(ni=>mult*blab[ni])
             .reduce((a,b)=>a+b,0);
          blab2[j]=nm+blab[j];
        }
        let ucount = JSChemify.Util.distinct(blab2).length;
        let t=blab2;
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
  ret.getBoundingBox=function(pad){
    if(!pad)pad=1;
    let pts=ret.getAtoms().map(at=>at.getPoint());
    ret.getSGroups().map(sg=>{
         sg.getBracketLocation().map(bloc=>{
             pts.push(bloc[0]);
             pts.push(bloc[1]);
         });
    });
     
    return JSChemify.ShapeUtils()
                    .getBoundingBox(pts,pad);
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
         let oAmap=[];
         carr.map(at=>{
            let natom= chem.addAtom(at.clone());
            oAmap[at.getIndexInParent()]=natom;
         });
         bonds.map(bd=>{
            let bbond= bd.clone();
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
     let cAtoms=[];
     ret.$atomComponentTypes.map((c,i)=>{
         let cInd=c-1;
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
      let counts={};
    let addTo=(s,v)=>{
        counts[s]=((counts[s])?counts[s]:0)+v;
    };
    ret.getAtoms()
       .map(a=>{
           let iH=a.getImplicitHydrogens();
        addTo("H",iH);
        addTo(a.getSymbol(),1);
       });
    let pref="";
    let org=false;
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
     let wt= ret.getAtoms()
              .map(a=>a.getMass())
              .reduce((a,b)=>a+b,0);
     let hs= ret.getAtoms()
         .map(a=>a.getImplicitHydrogens())
         .filter(h=>(h>0))
         .reduce((a,b)=>a+b,0);
         
     let hweight=JSChemify.Util
              .getElementFromSymbol("H")
                         .mass;
     return wt+hs*hweight;
  };
  ret.$markDirty=function(){
    ret.$bondTypes=null;
    ret.$atomComponentTypes=null;
    ret.$atomDistances=null;
    ret._rings=null;
    ret.$graphInvarient=null;
    ret.$$dirty++;
    ret.$EstateVector=null;
    ret.$componentCount=null;
    return ret;
  };
  ret.$dirtyNumber=function(){
      return ret.$$dirty;
  };
  
  ret.$getCloseClustersOfAtoms=function(tooClose){
      if(!tooClose)tooClose=0.3;
      let clusters=ret.getAtoms()
       .map(a=>a.getAtomsCloserThan(tooClose).concat(a))
       .filter(aa=>aa.length>1)
       .map(aa=>aa.sort((a,b)=>{
          if(a.getIndexInParent()<b.getIndexInParent()){
            return 1;
          }
            return -1;
       }))
       .map(aa=>{
           let mm={};
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
    ret.getRings()
       .filter(r=>r.isAromatic())
       .flatMap(r=>r.getBonds())
       .map(b=>b.setBondOrder(4));

    return ret;
  };
  
  ret.dearomatize=function(){
    //TODO implement this better
    let stack=ret.getRings()
                 .filter(r=>r.isAromatic())
                 .filter(r=>r.getBonds().filter(bb=>bb.getBondOrder()==4).length>0);
    
    stack.sort((a,b)=>{
        return a.getNeighborRingsAndBonds().length-b.getNeighborRingsAndBonds().length;
    });
    let done=[];
    while(stack.length>0){
      let nextRing=stack.pop();
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
      if(ret.getBondCount()<1)return 1;
      let stat= ret.getBonds()
              .map(b=>b._atom1.getVectorTo(b._atom2))
              .map(b=>JSChemify.Util.sqMagVector(b))
              .map(b=>[Math.sqrt(b),1])
              .reduce((a,b)=>JSChemify.Util.addVector(a,b));
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
    let rings = ret.getRings();
    let srings = rings.filter(r=>!r.isEnvelope());
    
    let idx=srings.map((a,i)=>i);
    let rbonds=[];
    
    for(var i=0;i<srings.length;i++){
        let tring=srings[i];
        for(var j=i+1;j<srings.length;j++){
           let nring =srings[j];
           let rbond = tring.getRingBond(nring);
           if(rbond!=null){
                rbonds.push({"idx":i,"rb":rbond});
                let mi=Math.min(idx[j],idx[i]);
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
    let rMap={};
    
    rbonds.map(irb=>{
        let ii=irb.idx;
        let rb=irb.rb;
      let lindex=idx[ii];
      let mm=rMap[lindex];
      if(!mm){
       mm=[];
       rMap[lindex]=mm;
      }
      mm.push(irb.rb);
    });
    let sRingsGrouped={};
    idx.map((a,i)=>{
        let ma=sRingsGrouped[a];
      if(!ma){
          ma=[];
        sRingsGrouped[a]=ma;
      }
        ma.push(srings[i]);
    });
    
    ret.$ringSystems= Object.keys(sRingsGrouped).map(k=>{
        let rbonds = rMap[k];
      let rrings = sRingsGrouped[k];
      if(!rbonds)rbonds=[];
        return JSChemify.RingSystem(rrings, rbonds);
    });
    return ret.$ringSystems;
  }
  
  ret.isRingBond=function(bd){
      let bidx=bd.getIndexInParent();
    ret.$detectRings();
    if(ret.$bondTypes[bidx]==="RING"){
        return true;
    }
    return false;
  };
  ret.getShortestAtomDistance=function(atom1,atom2){
      let ai1=atom1.getIndexInParent();
      let ai2=atom2.getIndexInParent();
      ret.$calculateDistances();
     
      let sDist= ret.$atomDistances[ai1][ai2];
      if(sDist>=0)return sDist;
      return -1;
  };
  ret.getNeighborAtomsAtDistance=function(atom,d){
      let ai1=atom.getIndexInParent();
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
    let lookup = ret.getAtoms()
                    .map(aa=>deltaMaker(aa));
    let matoms;
    let cType;
    order+="";
    if(order.endsWith("p") || order.endsWith("c")){
        cType = order.replace(/[0-9]/g, "");
        order = order.replace(/[^0-9]/g,"")-0;
    }
    if(!cType)cType="p";//path
    
    let doPath= cType.startsWith("p") || order<=2;
    let doCluster = (order>=3) && cType.endsWith("c")
    
    
    matoms = ret.getAtoms().map(aa=>[aa]);
    
    //This gets paths
    
    
    for(var i=0;i<order;i++){
        let cSet = {};
        matoms= matoms.flatMap(ml=>{
           let head = ml[0];
           let tail = ml[ml.length-1];
           let append=[];
           let prepend = head.getNeighborAtomsAndBonds()
                             .map(na=>na.atom)
                             .filter(na=>ml.indexOf(na)<0);
           let inserts=[];
   
           if(head!==tail){
             if(doCluster){
               for(var j=1;j<ml.length-1;j++){
                  let inew= ml[j].getNeighborAtomsAndBonds()
                      .map(na=>na.atom)
                      .filter(na=>ml.indexOf(na)<0);
                  inserts.push({"idx":j, "atoms":inew});
               }
             }
             append = tail.getNeighborAtomsAndBonds()
                  .map(na=>na.atom)
                  .filter(na=>ml.indexOf(na)<0);
           }
           let plist = prepend.map(pp=>[pp].concat(ml));
           let alist = append.map(pp=>ml.concat([pp]));
           let ilist = inserts.flatMap(is=>{
                   let nhead= ml.slice(0,is.idx);
                   let ntail= ml.slice(is.idx,ml.length);
                   return is.atoms.map(a=>nhead.concat([a]).concat(ntail));
           });
           if(i==2 && !doPath){
             return ilist;
           }
           return plist.concat(ilist)
                       .concat(alist);
         })
        .filter(ml=>{
            let canon=ml.map(at=>at.getIndexInParent()).sort().join(",");
            let canon2;
            if(!doCluster){
               let canon1=ml[0].getIndexInParent()+canon+ml[ml.length-1].getIndexInParent();
               canon2=ml[ml.length-1].getIndexInParent()+canon+ml[0].getIndexInParent();
               canon=canon1;
            }
            if(cSet[canon] || (canon2 && cSet[canon2])){
                return false;
            }else{
                cSet[canon]=true;
                cSet[canon2]=true;
            }
            return true;
      });
    }
    
    let sum1= matoms.map(mal=>{
             let prod = mal.map(mm=>lookup[mm.getIndexInParent()])
                           .reduce((a,b)=>a*b,1);
             return averager(prod,order);
                   })
                   .reduce((a,b)=>a+b,0);
    return sum1;        
                     
  };
  ret.$calculateDistances = function(){
    let MAX_DISTANCE=30;
    if(ret.$atomDistances)return ret;
    let soFar=[];
    let shortest=[];
    for(var i=0;i<ret._atoms.length;i++){
        let natoms=ret.getAtom(i).getNeighborAtomsAndBonds().map(a=>a.atom.getIndexInParent());
      shortest[i]=[];
      shortest[i][i]=0;
      soFar[i]=[natoms];
      natoms.map(ni=>shortest[i][ni]=1);
    }
    for(var d=0;d<MAX_DISTANCE;d++){
        for(var i=0;i<ret._atoms.length;i++){
          let dVec=soFar[i];
        let lastDVec=soFar[i][d];
        let newIndexes=JSChemify.Util.distinct(lastDVec.flatMap(di=>soFar[di][0])
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
      let bTypes=[];
      let aTypes=[];
      let assigned=0;
      let rings={};
      
      let remainingBonds = ret._bonds.filter(b=>!bTypes[b._idx]);
      let comp=1;
      let frontier = [];
      
      while(remainingBonds.length>0){
        let startAtom;
        
        if(frontier.length>0){
            startAtom=frontier.pop();
        }else{
            startAtom=remainingBonds[0].getAtoms()[0];
        }
        
        startAtom.$allPathsDepthFirst((path)=>{
          if(path.length>25){
            let natom=path[path.length-1].atom;
            if(frontier.indexOf(natom)<0){
                frontier.push(natom);
            }
            return true;
          }
          let lbond=path[path.length-1];
          let first=path.findIndex(p=>p.atom===lbond.atom);
        
          if(first<path.length-1){
               let nring=[];
               for(var j=first+1;j<path.length;j++){
                   let pnode=path[j].bond;
                   if(!bTypes[pnode._idx]){
                      assigned++;
                   }
                   nring.push(pnode);
                   bTypes[pnode._idx]="RING";
                   aTypes[pnode._atom1.getIndexInParent()]=comp;
                   aTypes[pnode._atom2.getIndexInParent()]=comp;
               }
               let cRing=JSChemify.Ring(nring).canonicalize();
               rings[cRing.toString()]=cRing;
               
               //stop going on this path
               return true;
          }else{
               if(!bTypes[lbond.bond._idx]){
                 lbond.bond.getIndexInParent();
                 bTypes[lbond.bond._idx]="CHAIN";
                 aTypes[lbond.bond._atom1.getIndexInParent()]=comp;
                 aTypes[lbond.bond._atom2.getIndexInParent()]=comp;
                 assigned++;
               }
          }
        });
        remainingBonds = ret._bonds.filter(b=>!bTypes[b._idx]);
        frontier=frontier.filter(aa=>aa.getBonds().filter(bb=>!bTypes[bb._idx]).length>0);
        if(frontier.length<=0){
            comp++;
        }
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
      let bcount = ret._bonds.length;
          let removedBonds = ret._removeAllFoliage();
      let bTypes=[];
      let assigned=0;
      
      removedBonds.map(rb=>{
          bTypes[rb.index]="FOLIAGE";
          assigned++;
      });
      
      
      //At this point anything left is either a linker or a ring
      //Now mark anything that has more than 2 bonds
      let terts = ret.getAtoms().filter(at=>at.getBondCount()>=3);
      let branchBonds=JSChemify.distinct(terts.flatMap(at=>at.getBonds()));
      
      let ringsPlusComponents = ()=>{
          return ret._bonds.length.length + ret.getAtoms().filter(at=>at.getBondCount()>0).length +2;
      };
      let RINGS_PLUS_COMPONENTS=ringsPlusComponents();
      for(var i=0;i<branchBonds.length;i++){
          let toRemoveBond = branchBonds[i];
        
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
      if(typeof bd.$oldIdx !=="undefined"){
         ret._bonds.splice(bd.$oldIdx, 0, bd);
         delete bd["$oldIdx"];
      }else{
         ret._bonds.push(bd);
      }
      bd.setParent(ret);
    }
    ret.$markDirty();
    return bd;
  };
  ret.removeBond=function(bd){
    let idx=bd.getIndexInParent();
    ret._bonds.splice(idx, 1);
    bd.$oldIdx=idx;
    ret.$markDirty();
    return ret;
  };
  ret.addNewBond = function(atom1,atom2, bondOrder, bondStereo){
      let bd=JSChemify.Bond().setParent(ret).setBond(atom1,atom2,bondOrder,bondStereo);
    return ret.addBond(bd);
  };
  ret.addNewAtom = function(symbol){
    let at=JSChemify.Atom().setSymbol(symbol);
    return ret.addAtom(at);
  };
  ret.getSGroups = function(){
      return ret._sgroups;
  };
  ret.addNewSGroup = function(num){
    if(!num){
       num=ret._sgroups.length+1;
    }
    let sg=JSChemify.SGroup()
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

  ret.deleteAnnotations=function(){
      ret.setAnnotations(null);
      return ret;
  };

  ret.getAnnotations=function(){
      return ret._annotations;
  };

  ret.setAnnotations=function(an){
     ret._annotations=an; 
     return ret;
  };
   
  ret.computeContributions=function(lambda){
     let annot=JSChemify.ChemicalDecorator()
               .setChemical(ret)
               .setLambda(lambda)
               .decorate();
     return ret.setAnnotations(annot);
  };
  
  ret.getEStateVector=function(d){
    if(!ret.$EstateVector){
       let vec={};
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
               let o=vec[vv[0]];
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
    let name=lines[start].trim();
    if(name){
       
       ret.setName(name);
    }
    let version=lines[3+start].substr(34,5).trim();
    let cursor=start;
    if(version === "V3000"){
    console.log("V3000");
        for(;cursor<lines.length;cursor++){
            let line = lines[cursor];
                         
            if(line.indexOf("M  V30 BEGIN ATOM")===0){
                cursor++;
                console.log("Found Block");
                for(;cursor<lines.length;cursor++){
                    let sline = lines[cursor];
                    if(sline.indexOf("M  V30 END ATOM")===0){
                        break;
                    }
                    let atomDetails = sline.split(" ");
                    let atom=ret.addNewAtom(atomDetails[4]).setXYZ(atomDetails[5]-0,atomDetails[6]-0,atomDetails[7]-0);
                    
                    atomDetails.filter(p=>p.indexOf("MASS")==0).map(p=>p.split("=")[1]-0).map(p=>atom.setIsotope(p));
                    atomDetails.filter(p=>p.indexOf("CHG")==0).map(p=>p.split("=")[1]-0).map(p=>atom.setCharge(p));
                    atomDetails.filter(p=>p.indexOf("RAD")==0).map(p=>p.split("=")[1]-0).map(p=>atom.setRadical(p));                    
                    
                }
            }else if(line.indexOf("M  V30 BEGIN BOND")===0){
                cursor++;
                let blookup=[0,1,6];
                for(;cursor<lines.length;cursor++){
                    let sline = lines[cursor];
                    if(sline.indexOf("M  V30 END BOND")===0){
                        break;
                    }
                    let bondDetails = sline.split(" ");
                    let bond=ret.addNewBond(bondDetails[5]-1,bondDetails[6]-1,bondDetails[4]-0);
                    bondDetails.filter(p=>p.indexOf("CFG")==0).map(p=>p.split("=")[1]-0)
                                .map(b=>blookup[b])
                                .map(p=>bond.setBondStereo(p));
                    
                }
            }
            
            let m=/M[ ][ ]END/y.exec(line);
             if(m){
               cursor++;
               break;
            }
        }
    }else{
        
        
        let acount=lines[3+start].substr(0,3).trim()-0;
        let bcount=lines[3+start].substr(3,3).trim()-0;
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
  ret._toBase64GzippedPromise=function(fun){
      return (new Promise(ok=>{
                  new Response(new Blob([fun(ret)])
                     .stream()
                     .pipeThrough(new CompressionStream("gzip"))
                     )
                  .blob()
                  .then(rr=>rr.arrayBuffer()
                              .then(ab=>{
                                  const compressedBase64 = btoa(
                                      String.fromCharCode(
                                       ...new Uint8Array(ab))
                                  );
                                  ok(compressedBase64);
                  }));
           }));
  };
  ret.toBase64GzippedSDPromise=function(){
     return ret._toBase64GzippedPromise((r)=>r.toSd());
  };
  ret.toBase64GzippedMolPromise=function(){
     return ret._toBase64GzippedPromise((r)=>r.toMol());
  };
  ret.fromBase64GzippedMolPromise=function(gzipped){
       return (new Promise(ok=>{
          let array=JSChemify.Util.base64Decode(gzipped);
          new Response(new Blob([array]).stream()
                           .pipeThrough(new DecompressionStream("gzip")))
                           .blob().then(bb=>{
                                 bb.text().then(txt=>{
                                    ok(ret.fromMol(txt));
                                 });
                           });
       }));
  };
  
  ret.toMol=function(){
    let d=new Date();
    let mmddyyhhmm=("0"+d.getDate()).substr(-2) + ("0"+d.getMonth()).substr(-2)+ ("0"+d.getYear()).substr(-2)+ ("0"+d.getHours()).substr(-2)+ ("0"+d.getMinutes()).substr(-2);
    let line2="JSChemify0"+mmddyyhhmm+"2D";
    let counts=("   "+ret.getAtomCount()).substr(-3) + ("   "+ret.getBondCount()).substr(-3);
    let mol=ret.getName() + "\n" + line2 + "\n\n"+counts+"  0  0  0  0              0 V2000\n";

    let atab=ret._atoms.map(at=>at.toMolLine()).join("\n");
    if(atab)mol+=atab;

    let btab=ret._bonds.map(bd=>bd.toMolLine()).join("\n");
    if(atab)mol+="\n" +btab;
    if(btab)mol+="\n";
    mol+=ret.molMBlocks();
    mol+=ret.molSBlocks();
    mol+="M  END";
    return mol;
  };
  ret.molSBlocks=function(){
     let buff=[];
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
         let catoms = sg.getAtoms();
         for(var i=0;i<catoms.length;i+=8){
            let salAtoms=Math.min(catoms.length,i+8)-i;
            buff.push("M  SAL");
            buff.push(("    "+num).substr(-4));
            buff.push(("    "+salAtoms).substr(-3));
            for(var j=i;j<Math.min(catoms.length,i+8);j++){
               let indx=catoms[j].getIndexInParent()+1;
               buff.push(("   "+ indx).substr(-4));
            }
            buff.push("\n");
         }
         let datoms=sg.getDisplayAtoms();
         if(datoms.length!==catoms.length){
            catoms = datoms;
            for(var i=0;i<catoms.length;i+=8){
               let salAtoms=Math.min(catoms.length,i+8)-i;
               buff.push("M  SPA");
               buff.push(("    "+num).substr(-4));
               buff.push(("    "+salAtoms).substr(-3));
               for(var j=i;j<Math.min(catoms.length,i+8);j++){
                  let indx=catoms[j].getIndexInParent()+1;
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
    let buff=[];
    //Charges
    let catoms=ret.getAtoms()
                  .filter(at=>at.getCharge()!==0);
    if(catoms.length>0){
        for(var i=0;i<catoms.length;i+=8){
          //"M  CHG  2  11  -1  21   1"
          buff.push("M  CHG  ");
          let chgAtoms=Math.min(catoms.length,i+8)-i;
          buff.push(chgAtoms);
          for(var j=i;j<Math.min(catoms.length,i+8);j++){
            let indx=catoms[j].getIndexInParent()+1;
            let chg=catoms[j].getCharge();
            buff.push(("   "+ indx).substr(-4));
            buff.push(("   "+ chg).substr(-4));
          }
          buff.push("\n");
      }
    }
    //isotopes
    let iatoms=ret.getAtoms().filter(at=>at.getIsotope()!==0);
    if(iatoms.length>0){
        for(var i=0;i<iatoms.length;i+=8){
          //"M  ISO  1  16  11"
          buff.push("M  ISO  ");
        let isoAtoms=Math.min(iatoms.length,i+8)-i;
        buff.push(isoAtoms);
          for(var j=i;j<Math.min(iatoms.length,i+8);j++){
            let indx=iatoms[j].getIndexInParent()+1;
          let iso=iatoms[j].getIsotope();
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
  ret.map=function(func){
      let oo=func(ret);
      if(oo){
         return oo;
      }
      return ret;
  };
  ret.peek=function(func){
      let oo=func(ret);
      return ret;
  };
  
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
  ret.toInChIObjectPromise=function(){
      return new Promise(ok => {
    JSChemify.Util.loadLibrary("inchi/inchi.js", ()=>{
        if(typeof inchiFromMolfile === "function")return true;
        return false;
    }).then(()=>{
        inchiFromMolfile(ret.clone().dearomatize().toMol(),null,"1.07.3").then(r=>{
            let nret={};
            nret.inchi=r.inchi;
            nret.auxinfo=r.auxinfo;
            inchikeyFromInchi(nret.inchi,"1.07.3").then(rr=>{
                nret.inchikey=rr.inchikey;
                ok(nret);
            });
        });    
    });
      });
  };
  ret.toInChIKeyPromise=function(){
    return ret.toInChIObjectPromise().then(r=>r.inchikey);
  };
  ret.toSmiles=function(){
      if(ret.getAtomCount()==0)return "";

      ret.getAtoms().map(aa=>{
         aa.setParityFromStereoBond(true);
      });

      
      let startAtom = ret.getAtom(0);
      let chain=[];
      let atomsGot=[];
      let takenLocants=[];
      let locantUsed=[];
      let getLowestLocant = (at)=>{
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
          let closedRings=[];
          let startTime=true;
           let branchStarts=[];
           startAtom.$allPathsDepthFirst((p,type)=>{
             let prevAtom = p[p.length-2];
             let newAtom = p[p.length-1];
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
                 let pBranch=branchStarts.pop();
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
             let rindx=p.findIndex(pa=>pa.atom===newAtom.atom);
             if(rindx<p.length-1){
               if(!p[rindx].locants){
                 p[rindx].locants=[];
               }
               let loc=getLowestLocant(p[rindx]);
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
          let last = chain[li];
          if((last+"").startsWith("BRANCH_END")){
            let index=last.split(":")[1]-0;
            chain[index]="";
            chain[li]="";
          }else{
              break;
          }
        }*/
        chain.filter(cc=>cc.atom).map(ca=>atomsGot[ca.atom.getIndexInParent()]=true);
        
        let ni = atomsGot.findIndex(g=>!g);
        if(ni>=0){
            startAtom=ret.getAtom(ni);
          
            chain.push("NEW");
        }else{
            startAtom=null;
        }
      }

      let canonClose={};
      let canonMap={};
      let nextLocant=(b)=>{
         for(let i=1;i<999;i++){
            if(!canonClose[i]){
               canonClose[i]=b;
               canonMap[b]=i;
               return i;
            }
         }
      };
      let closeLocant=((ci)=>{
            let std=canonMap[ci];
            canonMap[ci]=null;
            canonClose[std]=null;
            return std;
      });

      let bIndexOrder={};
      let border=[];
      chain.filter(cc=>cc.bond)
           .map(cc=>cc.bond)
           .map((bb,i)=>{
               bIndexOrder[bb.getIndexInParent()]=i;
               let a1i=bb.getAtom1().getIndexInParent();
               let a2i=bb.getAtom2().getIndexInParent();
               if(!border[a1i])border[a1i]=[];
               if(!border[a2i])border[a2i]=[];
               border[a1i].push(bb);
               border[a2i].push(bb);
           });
      let invParity={};
      border.map((bs,i)=>{
         let at=ret.getAtom(i);
         if(at.getParity()!==0){
            let obonds = ret.getAtom(i).getBonds();
            let perm=1;
            for(let j=0;j<obonds.length;j++){
               let nbond=obonds[j];
               let bind= bs.indexOf(nbond);
               if(bind===j)continue;
               perm=perm*-1;
               
               let tmp=bs[j];
               bs[j]=nbond;
               bs[bind]=tmp;
            }
            invParity[i]=perm;
         }
      });
      
      ret.getBonds().map(bb=>{
         bb.setBondGeometryFromCoordinates(true, bIndexOrder);
      });
     
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
        var tinv=invParity[cc.atom.getIndexInParent()];
        let loc=(cc.locants)?cc.locants.map(li=>nextLocant(li)).map(lo=>(lo>9)?"%"+lo:lo).join(""):"";
        if(!cc.bond){
          return cc.atom.toSmiles(tinv)+loc;
        }
        let bb=cc.bond.toSmiles();
        if(bb===":"){
          let aro=cc.bond.getAtoms().map(at=>at.toSmiles()).join("");
          if(aro===aro.toLowerCase()){
              bb="";
          }
        }
        if(cc.closeLocant){
            let nloc=closeLocant(cc.closeLocant);
            let cloc=((nloc-0)>9)?("%"+nloc):nloc;
            return bb + cloc;
        }
        
        //If there's a locant / ring-closure, it appears the parity tends to be inverted
        //so this is a fudge factor to fix this. Unclear if this works in every case.
        //TODO: investigate with mol=>smiles type conversions to confirm we're not
        //inverting stereo here
        if(loc){
            tinv=-1*tinv;
        }
        
        return bb + cc.atom.toSmiles(tinv)+loc;
      }).join("")
        .replace(/\(([0-9][0-9]*)\)/g,"$1");

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

   ret.clone=function(){
      let clone=JSChemify.SGroup();
      clone._chemType= ret._chemType;
      clone._type= ret._type;
      clone._atoms= ret._atoms;
      clone._crossBonds= ret._crossBonds;
      clone._connectivity= ret._connectivity;
      clone._displayAtoms= ret._displayAtoms;
      clone._label= ret._label;
      clone._bracket1= ret._bracket1;
      clone._bracket2= ret._bracket2;
      clone._parent= ret._parent;
      return clone;
   };
   ret.setCrossBonds=function(bds){
      ret._crossBonds=bds;
      return ret;
   };
   ret.addCrossBond=function(cb){
      if(!ret._crossBonds){
         ret._crossBonds=[];
      }
      ret._crossBonds.push(cb);
      return ret;
   };
   
   ret.setAtomsFromCrossBonds=function(){
      ret._atoms=[];
      ret._displayAtoms=null;
      let cbs=ret.getCrossBonds();
      if(cbs.length!==2){
         throw "Only support setting SGroup atoms from crossbonds when there are 2";
      }
      let b1a1=cbs[0].getAtom1();
      let b1a2=cbs[0].getAtom2();
      let b2a1=cbs[1].getAtom1();
      let b2a2=cbs[1].getAtom2();
      let d1=b1a1.getShortestAtomDistance(b2a1);
      let d2=b1a2.getShortestAtomDistance(b2a1);
      let startAtom=b1a1;
      if(d1>d2){
         startAtom=b1a2;
      }
      ret.addAtom(startAtom);
      let got={};
      got[cbs[0].getIndexInParent()]=true;
      got[cbs[1].getIndexInParent()]=true;
      startAtom.$allPathsDepthFirst((path)=>{
         let nnbondIdx=path[path.length-1].bond.getIndexInParent();
         if(got[nnbondIdx]){
            return true;
         }
         got[nnbondIdx]=true;
         let natom=path[path.length-1].atom;
         ret.addAtom(natom);
      });
   };
   
   ret.getIndex=function(){
      return ret._index;
   };  
   ret.setIndex=function(s){
      ret._index=s;
      return ret;
   };
   ret.addAtom=function(a){
      //only add if not already present
      if(ret._atoms.indexOf(a)<0){
         ret._atoms.push(a);
      }
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
      if(!ret._label){
         if(ret.getType()==="SRU"){
            //TODO: is this right?
            ret.setLabel("n");
         }
      }
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
   ret.getHiddenAtoms=function(){
      let dats=ret.getDisplayAtoms();
      let ats=ret.getAtoms();
      if(ats.length===dats.length)return [];
      let hide= ats.filter(aa=>dats.indexOf(aa)<0);
      return hide;
   };
   ret.setDisplayAtoms=function(ats){
      ret._displayAtoms=ats;
      return ret;
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
   ret.getBoundingBox=function(pad){
      if(typeof pad === "undefined"){
          pad=1;  
      }
      return JSChemify.ShapeUtils()
                      .getBoundingBox(ret.getAtoms(),pad);
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
            let cbonds=ret.getCrossBonds();
            if(cbonds.length===2){
               let cpt=ret.getCenterPoint();

               //TODO: make bracket snap to a cardinal direction
               // probably?
               
               let b1=cbonds[0];
               let b2=cbonds[1];
               let c1=b1.getCenterPoint();
               let c2=b2.getCenterPoint();
               let d1=b1.getDeltaVector();
               let d2=b2.getDeltaVector();
               /*
               let vecB1d1=JSChemify.Util.sqMagVector(b1.getAtom1().getVectorToPoint(cpt));
               let vecB1d2=JSChemify.Util.sqMagVector(b1.getAtom2().getVectorToPoint(cpt));
               
               let vecB2d1=JSChemify.Util.sqMagVector(b2.getAtom1().getVectorToPoint(cpt));
               let vecB2d2=JSChemify.Util.sqMagVector(b2.getAtom2().getVectorToPoint(cpt));
               */
               
               let mag1 = Math.sqrt(JSChemify.Util.sqMagVector(d1));
               let mag2 = Math.sqrt(JSChemify.Util.sqMagVector(d2));

               let dBrac= [
                  c2[0]-c1[0],c2[1]-c1[1]
               ];
               let dCent= [
                  1,1
               ];
               let dot=dBrac[0]*dCent[0]+dBrac[1]*dCent[1];
               
               
               if(Math.abs(d1[0])>Math.abs(d1[1])){
                  d1=[-Math.abs(mag1),0];
               }else{
                  d1=[0,-Math.abs(mag1)];
               }
               
               
               if(Math.abs(d2[0])>Math.abs(d2[1])){
                  d2=[-Math.abs(mag2),0];
               }else{
                  d2=[0,-Math.abs(mag2)];
               }
               /*
               if(vecB1d1>vecB1d2){
                  d1[0]=-d1[0];
                  d1[1]=-d1[1];
               }
               
               if(vecB2d1>vecB2d2){
                  d2[0]=-d2[0];
                  d2[1]=-d2[1];
               }
               */
               
               ret._bracket1=[[c1[0]-d1[1]/2,c1[1]+d1[0]/2],
                              [c1[0]+d1[1]/2,c1[1]-d1[0]/2]];
                              
               ret._bracket2=[[c2[0]+d2[1]/2,c2[1]-d2[0]/2],
                             [c2[0]-d2[1]/2,c2[1]+d2[0]/2]];
               if(dot<0){
                  let t= ret._bracket1;
                  ret._bracket1=ret._bracket2;
                  ret._bracket2=t;
                  t=ret._bracket1[1];
                  ret._bracket1[1]=ret._bracket1[0];
                  ret._bracket1[0]=t;
                  t=ret._bracket2[1];
                  ret._bracket2[1]=ret._bracket2[0];
                  ret._bracket2[0]=t;
               }
               
            }else{
               let bbox=ret.getBoundingBox(1);
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
    let ret={};
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
            let counts={};
          ret.getBonds()
             .flatMap(b=>b.getAtoms())
             .map(a=>{
                 let cc=counts[a.getIndexInParent()];
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
    let ret={};
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
          let cpoint=ret.getRings()
                      .map(r=>r.getCenterPoint().map(a=>a))
                      .map(cp=>{
                          cp.push(1);
                          return cp;
                       })
                      .reduce((a,b)=>JSChemify.Util.addVector(a,b));
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
  let ret={};
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
        let s=ret.getSize();
        ret.$envelope=(ret.getBonds()
                       .filter(b=>b.getSmallestRingSize()===s)
                       .length==0);
    }
    return ret.$envelope;
  };
  
  ret.getRingBond=function(r2){
      let cbs = ret.getConnectedBonds(r2);
    let cas = ret.getConnectedAtoms(r2);
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
      let sumV=ret.getAtoms()
         .map(a=>[a.getX(),a.getY(),1])
         .reduce((a,b)=>JSChemify.Util.addVector(a,b));
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
    let atoms=[];
    let bds=ret.getBonds();
    let fbond = bds[0];
    let swap=false;
    let patoms=null;
    bds.map((b,j)=>{
        if(j==bds.length-1)return;
        if(patoms==null){
          atoms.push(b.getAtoms()[0]);
          atoms.push(b.getAtoms()[1]);
          patoms=[b.getAtoms()[0],b.getAtoms()[1]];
        }else{
          let atn;
          if(patoms.length===1){
               atn=patoms.map(a=>b.getOtherAtom(a))
                        .filter(at=>at!==null);
          }else{
               let oat=b.getOtherAtom(patoms[0]);
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
         let f=atoms[0];
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
      let ni=(bi+2*ret.getSize())%ret.getSize();
    return ret._ring[ni];
  }
  ret.dearomatize=function(){
    let s=ret.getSize();
    if(s%2===0 || s%2===1){
      let startOrder=1;
      let startIndex=0;
      
      let aset = ret.getBonds()
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
       
      let hetero1=ret.getAtoms()
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
        let b= ret.getBondAt(i+startIndex);
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
  ret.isExplicitlyAromatic=function(){
      return ret.getBonds().findIndex(b=>b.getBondOrder()!==4)<0;
  };
  ret.isAromatic=function(){
      let s=ret.getSize();
      if(s>6||s<5)return false;
    if(s%2===0){
        for(var i=0;i<s;i++){
          let bo1=ret._ring[i].getBondOrder();
          let bo2=ret._ring[(i+1)%s].getBondOrder();
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
          let bo1=ret._ring[i].getBondOrder();
          let bo2=ret._ring[(i+1)%s].getBondOrder();
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
          let shared=atoms2[0];
          if(atoms1.indexOf(shared)<0){
              shared=atoms2[1];
          }
          let sa=shared.getSymbol();
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
      let lowest=ret._ring.map((b,i)=>[b.getIndexInParent(),i]).reduce((a,b)=>{
      if(a[0]<b[0])return a;
      return b;
    });
    let gi1=(lowest[1]+1)%ret._ring.length;
    let gi2=(lowest[1]-1+ret._ring.length)%ret._ring.length;
    let rev=true;
    if(ret._ring[gi1].getIndexInParent()<ret._ring[gi2].getIndexInParent()){
        rev=false;        
    }
    let nring=[];
    for(var j=0;j<ret._ring.length;j++){
        let nj=(rev)?((lowest[1]-j)+ret._ring.length):lowest[1]+j;
        let gi=nj%ret._ring.length;
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
/*****************************
ChemicalFeatureFactory
==============================
Status: still thinking
*****************************/
JSChemify.ChemicalFeatureFactory=function(){
   let ret={};

   ret.makeFeatures=function(c){
      
   };


   return ret;
};
/*****************************
ChemialFeatures
==============================
Status: in progress



*****************************/
JSChemify.ChemicalFeatures=function(arg){
   if(arg && arg._counts){
      return arg;
   }
   let ret={};
   ret._counts={};
   ret.$l2=null;

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
   ret.setFeatures=function(counts){
      ret._counts=counts;
      return ret;
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
   ret.toBinaryFingerprint=function(size){
      if(!size){
         size=1024;
      }
      let fp=ret.toFoldedFingerprint(size);
      let arr = new UintArray(Math.ceil(size/8));
      fp.map((v,i)=>{
         let pos=Math.floor(i/8);
         let subpos=i%8;
         arr[pos]=arr[pos] | (1<<subpos);
      });
      return arr;
   };
   ret.getFeatureSet=function(){
      return Object.keys(ret._count);
   };
   ret.l2=function(){
      if(!ret.$l2){
         ret.$l2=Objects.values(ret._counts)
                        .map(v=>v*v)
                        .reduce((a,b)=>a+b);
         ret.$l2=Math.sqrt(ret.$l2);
      }
      return ret.$l2;
   };
   ret.getFeatureCount=function(k){
      let cnt=ret._count[k];
      if(cnt||cnt===0)return cnt;
      return 0;
   };
   ret.cosineTo=function(cf2){
       cf2=JSChemify.EState(cf2);
       let at1=ret.getFeatureSet();
       let at2=v.getFeatureSet();
       let allKeys = {};
       at1.map(k=>allKeys[k]=1);
       at2.map(k=>allKeys[k]=1);
       let dotSum=0;
       Object.keys(allKeys).map(k=>{
           let dot=ret.getFeatureCount(k)*v.getFeatureCount(k);
           dotSum+=dot;
       });
       return dotSum/(ret.l2()*v.l2());
   };
   if(arg && typeof arg==="object"){
      return ret.setFeatures(arg);
   }
   
   return ret;
};
/*******************************
/* ChemicalDecorator
/*******************************
Status: PROTOTYPE

This utility will take a property
definition (a lambda) and produce
the numeric value for a given
chemical. Then it will perturb the
chemical by changing the atoms and
bonds and recalculating the property,
annotating where the value changed
and by how much. Each atom and bond
receive a delta score for how much
that property would change.

**********************************/
JSChemify.ChemicalDecorator=function(){
   let ret={};
   ret._chem=null;
   ret._lambda=null;
   
   ret.setChemical=function(c){
      ret._chem=JSChemify.Chemical(c);
      return ret;
   };
   ret.setProperty=function(l){
      ret._lambda=l;
      return ret;
   };
   ret.setLambda=function(l){
      return ret.setProperty(l);
   };
   //This method will calculate how a given
   //property calculation will change if each
   //atom is replaced with a neutral C and 
   //each bond attached to that atom with a 
   //single bond
   ret.decorate=function(c,l){
      if(c)ret.setChemical(c);
      if(l)ret.setLambda(l);
      c=ret._chem;
      l=ret._lambda;
      let atDecorations=[];
      let bdDecorations=[];
      let defAtom=JSChemify.Atom().setSymbol("C");
      let defBond=JSChemify.Bond().setBondOrder(1);
      let prop=l(c);
      let comp=c.getComponentCount();
      for(let i=0;i<c.getAtomCount();i++){
         let at=c.getAtom(i);
         let bds=at.getBonds();
         let cat=at.clone();
         let bdsclone=bds.map(b=>b.clone());
         at.setAtomTo(defAtom);
         bds.map(b=>b.setBondTo(defBond));
         //we can definitely be more
         //efficient than this
         c.$markDirty();
         atDecorations[i]=prop-l(c);
         at.setAtomTo(cat);
         bds.map((b,i)=>b.setBondTo(bdsclone[i]));
      }
      
      for(let i=0;i<c.getBondCount();i++){
         let bd=c.getBond(i);
         c.removeBond(bd);
         
         if(c.getComponentCount()>comp){
            let largest=c.getComponents().reduce((a,b)=>{
               if(a.getMolWeight()>b.getMolWeight()){
                  return a;
               }
               return b;
            });
            bdDecorations[i]=prop-l(largest);
         }else{
            bdDecorations[i]=prop-l(c);
         }
         c.addBond(bd);
      }
      let avg=atDecorations.map((a,i)=>{
            let at=c.getAtom(i);
            let sumBonds=at
             .getBonds()
             .map(b=>b.getIndexInParent())
             .map(bi=>bdDecorations[bi])
             .reduce((a,b)=>a+b);
            return (sumBonds+a)/(1+at.getBondCount());
      });
      let amax=atDecorations.reduce((a,b)=>Math.max(Math.abs(a),Math.abs(b)));
      let bmax=bdDecorations.reduce((a,b)=>Math.max(Math.abs(a),Math.abs(b)));

      //console.log(bdDecorations);
      
      
      return {
             "value": prop, 
             "atoms": atDecorations, 
             "bonds": bdDecorations,
             "bondMax":bmax,
             "bondMin":-bmax,
             "atomMax":amax,
             "atomMin":-amax,
         
             "avgBoth":avg
             };
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
         if(ret.sameAtom(b1.getAtom1(),b2.getAtom1()) &&
            ret.sameAtom(b1.getAtom2(),b2.getAtom2())
                        ){
            dir=1;
         }
         if(ret.sameAtom(b1.getAtom2(),b2.getAtom1()) &&
            ret.sameAtom(b1.getAtom1(),b2.getAtom2())
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
         a1.getIsotope() === a2.getIsotope()
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
         let qBondsLeft=ret._queryBondLeft[qBondIndex];
         let qBondsRight=ret._queryBondRight[qBondIndex];

         let tbond = tbondTry[0].getIndexInParent();
         
         let tBondsLeft=targetBondLeft[tbond];
         let tBondsRight=targetBondRight[tbond];

         
         
         //Options:
         // each qLeft has a matching tLeft
         //    try one, add to stack
         //
         
         if(qBondLeft.length>0){
            if(forward){
               if(tBondsLeft.length>0){
                  //we gotta try each
               }
            }
         }
         
         //TODO FINISH
         //if(qBondLeft.length
         
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
  let ret={};
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
    let _nVec={};
    avgV.getAtomTypes().map(k=>{
        let aa=avgV.getComponent(k);
        let sa=sigmaV.getComponent(k);
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
    let at1=ret.getAtomTypes();
    let at2=v.getAtomTypes();
    let allKeys = {};
    at1.map(k=>allKeys[k]=1);
    at2.map(k=>allKeys[k]=1);
    let sqDist=0;
    Object.keys(allKeys).map(k=>{
        let dc=ret.getComponent(k)-v.getComponent(k);
      sqDist=sqDist+dc*dc;
    });
    return Math.sqrt(sqDist);
  };
  ret.l2=function(){
    let mag=0;
    ret.getAtomTypes().map(k=>{
        let cc=ret.getComponent(k);
        mag+=cc*cc;
    });
    return Math.sqrt(mag);
  };
  ret.cosineTo=function(v){
      v=JSChemify.EState(v);
    let at1=ret.getAtomTypes();
    let at2=v.getAtomTypes();
    let allKeys = {};
    at1.map(k=>allKeys[k]=1);
    at2.map(k=>allKeys[k]=1);
    let dotSum=0;
    Object.keys(allKeys).map(k=>{
        let dot=ret.getComponent(k)*v.getComponent(k);
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
  let ret={};
  ret._input=null;
  ret._bonds=[];
  ret._atoms=[];
  
  //TODO implement InChI
  
  ret.setInput=function(s){
       ret._input=s;
    return ret;
  };
  
  ret.parseFormula=function(f){
    let regex=/([A-Z][a-z]{0,1})([0-9]*)/y;
    let all=[];
    let order=[];
    
    regex.lastIndex=0;
    while(regex.lastIndex<f.length){
      let m=regex.exec(f);
      if(m){
        let c=1;
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
    let regex=/([0-9][0-9]*)/y;
    regex.lastIndex=1;
    let prevNum=-1;
    let stack=[];
    let all=[];
    let bonds=[];
    while(regex.lastIndex<f.length){
      let m=regex.exec(c);
      if(m){
          let num=m[0];
        if(prevNum>0){
            bonds.push([prevNum,num]);
          regex.lastIndex=regex.lastIndex+m[0].length;
                    let next=c[regex.lastIndex];
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
    let layers=ret._input.split("/");
    let version=layers[0];
    let form=layers[1];
    let connectivity=layers[2];
    let fixedhydrogens=layers[3];
    let relativeStereo=layers[4];
    
    
    let symbols=ret.parseFormula(form);
    let connections=ret.parseConnectivity(connectivity);
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
  let ret={};
  ret._input=null;
  ret._head=0;
  ret._atoms=[];
  ret._bonds=[];
  ret._branchIndex=[];
  ret._locantIndex={};
  ret._locantBond={};
  ret._locantBondNumber={};
  ret._bondNumber=0;
  ret._bondOnDeck="!";
  ret._geomOnDeck="!";
  ret._targetAtomIndex=null;
  ret._decorateProperty=null;
  
  ret.setInput=function(s){
    ret._input=s;
    ret._head=0;
    return ret;
  };
  ret.setHead=function(i){
    ret._head=i;
    return ret;
  };
  ret.getHead=function(){
      return ret._head;
  };
  ret.readNext=function(regex,pred){
    regex.lastIndex=ret._head;
     
    let match=regex.exec(ret._input);
    if(match){
        if(pred && !pred(match))return null;
        //ret._slice=ret._slice.substr(match[0].length);
        ret._head=ret._head+match[0].length;
        
        return match;
    };
    return null;
  };
  ret.getBondOnDeck=function(atom){
      if(ret._bondOnDeck!=="!")return ret._bondOnDeck;
      if(!atom)return "-";
      let oat=ret._atoms[ret._targetAtomIndex];
      if(oat.type==="a" && atom.type==="a"){
          return "a:";
      }
      return "-";
  };
  ret.addAtom=function(atom){
      if(ret._targetAtomIndex!==null){
          let bt=ret.getBondOnDeck(atom);
         
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
            let l1=ret._locantIndex[l];
        
        if(ret._locantBond[l]!=="!!"){
            ret._bondOnDeck=ret._locantBond[l];
            ret._locantBond[l]="!!";
        }
        let num = ret._locantBondNumber[l];
        let bt=ret.getBondOnDeck(ret._atoms[l1]);
        
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
        if(ret._bondOnDeck!=="!"){
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
        let l1=ret._locantIndex[l-0];
        if(ret._locantBond[l]!=="!!"){
            ret._bondOnDeck=ret._locantBond[l];
            ret._locantBond[l]="!!";
        }
        let num = ret._locantBondNumber[l];
        let bt=ret.getBondOnDeck(ret._atoms[l1]);
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
          let nat=chemical.addNewAtom(at.atom);
          if(at.charge && at.charge.length===1){
              nat.setCharge((at.charge+"1")-0);
          }else if(at.charge && at.charge.length>1){
              nat.setCharge((at.charge)-0);
          }
          if(at.isotope){
              let iso=(at.isotope)-0;
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
      let bdsToCheck={};
      let lastB=-1;
      
      ret._bonds.map((bd,i)=>{
               
           let nbd=chemical.addNewBond(bd.atom1,bd.atom2,1);
           if(bd.type=="-"){
                   nbd.setBondOrder(1);
           }else if(bd.type=="="){
                   nbd.setBondOrder(2);
           }else if(bd.type=="#"){
                   nbd.setBondOrder(3);
           }else if(bd.type==":"){
                   nbd.setBondOrder(4);
           }else if(bd.type=="~"){
                   nbd.setBondOrder(0);
           }else if(bd.type=="\/"){
                   nbd.setBondOrder(1);
                   nbd.setBondGeometry(JSChemify.CONSTANTS.BOND_GEOM_UP);
           }else if(bd.type=="\\"){
                   nbd.setBondOrder(1);
                   nbd.setBondGeometry(JSChemify.CONSTANTS.BOND_GEOM_DOWN);
           }else if(bd.type=="a:"){
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
      let m=ret.readNext(/[A-Z*][a-z]{0,1}/y,(p)=>{
          try{
              let el=JSChemify.Util.getElementFromSymbol(p[0]);
              //Allow "bare hydrogen" to be read
              if(p[0]==="H")return true;
              return (el.smiles)?true:false;
          }catch(e){
            return false;
          }
          return true;
      });
      if(m){
         return ret.addAtom({"atom":m[0]});
      }
      m=ret.readNext(/[C|N|O|S|P|I|F]/y);
      if(m){
        return ret.addAtom({"atom":m[0]});
      }
      m=ret.readNext(/[c|n|o|s|p]/y);
      if(m){
        return ret.addAtom({"atom":m[0].toUpperCase(),"type":"a"});
      }
      m=ret.readNext(/\[([0-9]{0,3})([A-Z*][a-z]{0,2})([@]{1,2})?(H[0-9]*)?([+|-]{1,}[0-9]*)?([:][0-9]{1,3})?\]/y);
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
      m=ret.readNext(/\[([0-9]{0,3})([a-z]{1})([@]{1,2})?(H[0-9]*)?([+|-]{1,}[0-9]*)?([:][0-9]{1,3})?\]/y);
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
      throw "parse error, unexpected atom format:" + ret._input.substr(ret._head);
  }
  ret.parseLocants=function(){
          let got1=true;
          while(got1){
        got1=false;
        let m=ret.readNext(/[%][0-9][0-9]/y);
        if(m){
           ret.addLocant(m[0].substr(1));
           got1=true;
        }
        m=ret.readNext(/[0-9]/y);
        if(m){
           ret.addLocant(m[0]);
           got1=true;
        }
      }
      
      return ret;
  };
  ret.parseCloseLocants=function(){
      let got1=true;
      while(got1){
        got1=false;
        let m=ret.readNext(/[%][0-9][0-9]/y);
        if(m){
           ret.addCloseLocant(m[0].substr(1));
           got1=true;
        }
        m=ret.readNext(/[0-9]/y);
        if(m){
           ret.addCloseLocant(m[0]);
           got1=true;
        }
      }
      
      return ret;
  };
  ret.parseBond=function(){
      let m=ret.readNext(/[-:=#~\\\/]/y);
      if(m){
        ret.addBond(m[0]);
      }else{
        //ret.addBond("-");
      }
      return ret;
  };
  ret.parseBranchOrComponent=function(){
      let m=ret.readNext(/\(/y);
      if(m){
        ret.startBranch();
        ret.parseBond();
      }else{
          m=ret.readNext(/\)/y);
        if(m){
            ret.endBranch();
          ret.parseBranchOrComponent();
          ret.parseBond();
        }else{
          m=ret.readNext(/\./y);
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
      return ret._head>=ret._input.length;
  };
  ret.parse=function(smiles, chem){
      ret.setInput(smiles);
      while(!ret.isEnd()){
         
         if(ret.isEnd())break;
          ret.parseAtom();
        
          ret.parseBond();
          ret.parseLocants();
        
          let ohead=ret.getHead();

          while(true){
             ret.parseBranchOrComponent();
             ret.parseCloseLocants();
             if(ret.getHead()>ohead){
                ohead=ret.getHead();
             }else{
                break;
             }
          }
          
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
        let old=ret._properties[k];
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
     cursor:pointer;
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
        let headHTML = "<thead><tr><th>Structure</th><th>Name</th>"
               + ret._propertyOrder.map(p=>"<th>" + p + "</th>").join("") 
                  + "</tr></thead>";
        return headHTML;
   };
   ret.$getRowHTML=function(ri){
        let chem=ret.getChemical(ri);
        if(!chem.hasCoordinates()){
           try{
              chem.generateCoordinates();
           }catch(e){
              console.log(e);
              console.log(chem.toSmiles());
           }
        }
        let cchem=chem;
        try{
           cchem=chem.clone().dearomatize();  
        }catch(e){
           console.log(e);
           console.log(chem.toSmiles());
           
        }
        let ifUndef=(vv,ee)=>{
           if(vv===undefined){
               return ee;
           }else{
               return vv;
           }
        };
        let rowHTML = "<tr><td><div class='jschemify-tbl-image'>" + cchem.getSVG() + "</div><textarea onclick='this.focus();this.select()' readonly='readonly' class='jschemify-tbl-smiles'>" 
               + cchem.toSmiles() +"</textarea></td><td>" + chem.getName() + "</td>"
               + ret._propertyOrder.map(p=>"<td class='jschemify-tbl-data chem-" + ri + " prop-" + JSChemify.Util.simpleEncode(p)
               + "'>" + ifUndef(chem.getProperty(p),"") + "</td>").join("") 
                  + "</tr>";
        return rowHTML;
   };
   ret.$getTableHTML=function(maxRows){
         if(!maxRows)maxRows=20;
         maxRows=Math.min(maxRows,ret.getChemicalCount());
         JSChemify.Global[ret.getCollectionID()]=ret;
         let rowCounts=JSChemify.Util.distinct([maxRows,10,20,50,"All"]);
         
               
         let topPart=`<div id="` + ret._collectionID + `">
         <div class="jschemify-table-controls">
         <div style="display:none;" id="jschemify-raw-panel">
            <button id="jschemify-show-table">Show Table</button>
            <textarea id="jschemify-raw"></textarea>
         </div>
         <div id="js-full-table-view">
         <div id="js-full-table-parent-controls">
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
         <select id="jschemify-rows-per-page">` 
            + rowCounts.map(rc=>"<option>" + rc + "</option>").join("\n") +
         `</select>
         Showing <span id="jschemify-display-count">1-` +  maxRows + `</span> of <span id="total">` + ret.getChemicalCount() + `</span>
         <button id="jschemify-page-previous" disabled="">previous</button>
         <button id="jschemify-page-next">next</button></span>
         
         </div>

         <div>
         <span>
           Calculate New Column
           <select id="jschemify-calculate-newcolumn">
          <option value="">-- cacluations --</option>
          <option value="c.toInChIKeyPromise()">InChIKey</option>
              <option value="c.getMolWeight()">Molecular Weight</option>
              <option value="c.getMolFormula()">Molecular Formula</option>          
       </select>
           <label for="jschemify-calculate-newcolumn-name">Column Name</label>
           <input id="jschemify-calculate-newcolumn-name" value="">       
           <label for="jschemify-calculate-newcolumn-formula">Column Formula</label>
           <input id="jschemify-calculate-newcolumn-formula" value="">
           <button id="jschemify-calculate-newcolumn-add">Add Column</button>
         </div>
         
         <div class="jschemify-table-query">
         Query Smiles
         <input id="jschemify-query" value="CCCCCC">
         <select id="jschemify-query-type">
         <option>E-State</option>
         </select>
         <label for="jschemify-query-highlight">Highlight?</label>
         <input type="checkbox" name="jschemify-query-highlight" id="jschemify-query-highlight" unchecked>
         <select id="jschemify-query-estate-metric">
         <option>Euclidean Distance</option>
         <option>Cosine Distance</option>
         </select>
         <button id="jschemify-query-search">Search</button>
         <div id="jschemify-query-img" class="jschemify-tbl-image">
         </div>
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
   
   ret.$makePromptDialogPromise=function(title, input){
        return new Promise((ok)=>{
                // Create dialog
                const dialog = document.createElement('div');
                dialog.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    padding: 20px;
                    border-radius: 5px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    z-index: 1000;
                `;
                
                
                const titleH3 = document.createElement('h3');
                titleH3.innerHTML = title;
                titleH3.style.cssText = `
                    width: 100%;
                    display:block;
                `;
                dialog.appendChild(titleH3);

                // Create textarea
                const textarea = document.createElement('textarea');
                textarea.value = input;
                textarea.style.cssText = `
                    width: 100%;
                    height: 200px;
                    margin-bottom: 10px;
                `;
                dialog.appendChild(textarea);

                // Create buttons
                const buttonContainer = document.createElement('div');
                buttonContainer.style.display = 'flex';
                buttonContainer.style.justifyContent = 'space-between';

                const saveButton = document.createElement('button');
                saveButton.textContent = 'Save';
                saveButton.onclick = () => {
                    let val=textarea.value;
                    document.body.removeChild(dialog);
                    ok(val);
                };

                const cancelButton = document.createElement('button');
                cancelButton.textContent = 'Cancel';
                cancelButton.onclick = () => {
                    document.body.removeChild(dialog);
                };

                buttonContainer.appendChild(cancelButton);
                buttonContainer.appendChild(saveButton);
                dialog.appendChild(buttonContainer);

                // Add dialog to body
                document.body.appendChild(dialog);
                setTimeout(()=>textarea.focus(),10);
                
        });
   };
   
   ret.$registerEvents=function(){
       
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

      
      let top=pageCountElm.innerHTML.split("-")[1]-0;
      let skip=pageCountElm.innerHTML.split("-")[0]-1;

      $("#jschemify-calculate-newcolumn").onchange=(t)=>{
         t=t.target;
         $("#jschemify-calculate-newcolumn-name").value=t[t.selectedIndex].innerText;
         $("#jschemify-calculate-newcolumn-formula").value=t[t.selectedIndex].value;
      };
     
       
       
      $("#mfile").onchange=(e)=>{
           $("#mfile").style="display:none;"; 
           let file = e.target.files[0];
           if (!file) {
             return;
           }
           let reader = new FileReader();
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
      let resetZoom=()=>{
          $$(".jschemify-tbl-image").forEach(e=>{
               e.onclick=()=>{
                    if(!e.style || e.style.length<=1 ){
                       e.style="max-width: 500px;width: 100%;position: fixed;z-index: 9999999;top: 0px;background-color: white;padding: 10px;left: 300px;border: 2px solid #fa0202;";
                    }else{
                       e.style="";
                    }
                  };
          });
      };
       
      resetZoom();
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
         resetZoom();
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
                  let diff = pA-pB;
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
         //How to make the edit?
         $$(".jschemify-tbl-data").forEach(elm=>{
             elm.onclick = (e=>{
                console.log("clicked");
                //Options:
                // 1. Edit in place by replacing with text area
                // 2. Edit in place by just making editable div
                // 3. Popup for edit
                // 4. Formula bar edit
                //
                
                let chem = ret.getChemical(elm.className.split(" ")
                                                .filter(cc=>cc.indexOf("chem-")===0)
                                                .map(cc=>cc.split("-")[1]-0)[0]);
                let prop = elm.className.split(" ")
                                                .filter(cc=>cc.indexOf("prop-")===0)
                                                .map(cc=>cc.split("-"))
                                                .map(cc=>cc.filter((v,i)=>i>0))
                                                .map(cc=>cc.join("-"))
                                                .map(cc=>JSChemify.Util.simpleDecode(cc))[0];
                let pval = chem.getProperty(prop);
                if(!pval && pval !==0 && pval!==NaN){
                    pval = "";
                }
                ret.$makePromptDialogPromise("Editing " + prop,pval).then(v=>{
                    
                    chem.setProperty(prop, v);
                    refreshTable();
                });                
                
                
             });
         });
         
      };
      update=tt;
      tt();
      
      
      //jschemify-calculate-newcolumn-add
      $("#jschemify-calculate-newcolumn-add").onclick=()=>{
            let cname=$("#jschemify-calculate-newcolumn-name").value;
            let cform=$("#jschemify-calculate-newcolumn-formula").value;
            let decorate=false;
              
            ret.computeNewProperty(cname,(c)=>{
                let ev=eval(cform);
                if(ev && ev.serialize){
                   ev=ev.serialize();
                }
                if(JSChemify.Util.isPromise(ev)){
                    return ev.then(ee=>{
                       console.log(ee);
                       if(ee && ee.serialize){
                            ee=ee.serialize();
                       }
                       if(typeof ee === "object"){
                            return JSON.stringify(ee);
                       }
                       return ee;
                    });
                }else{
                    if(typeof ev ==="object"){
                       ev=JSON.stringify(ev);
                    }
                }
                return ev;
            },decorate).then((oo)=>{ 
                refreshTable();
            });
      };
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
            updateTopSkip(top,0);
            refreshTable();
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
         let high=$("#jschemify-query-highlight").checked;
         if(high){
            high=-1;
         }else{
            high=0;
         }
         ret.computeNewProperty("Distance",(cc)=>{
            let tar=cc.getEStateVector();
            if(type==="Cosine Distance"){
               return (1-tar.cosineTo(estate));
            }else{
               return tar.distanceTo(estate);
            }
            
         },high);
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
          let name=i;
          let smiles=l[0];
          let pnot=null;
          if(headerIndex["name"]>=0){
            name=l[headerIndex["name"]];
          }
          if(headerIndex["smiles"]>=0){
            smiles=l[headerIndex["smiles"]];
          }
          if(headerIndex["path_notation"]>=0){
            pnot=l[headerIndex["path_notation"]];
          }
          let chem;
          try{
                chem= JSChemify.Chemical().fromSmiles(smiles).setName(name);
                if(pnot){
                    chem.setPathNotation(pnot);
                }
          }catch(e){
              chem= JSChemify.Chemical().setName(name);
              chem.setProperty("JSCHEMIFY_MESSAGE", "trouble reading smiles:'" + smiles + "' " + e + "");
          }
          
           
          for(var i=0;i<header.length;i++){
	    let val = l[i];
	    if(val)val=val.replace(/\\n/g,"\n");
	    
	    if(header[i].toLowerCase()==="name"){
              chem.setName(val);
	    }
            if(header[i].toLowerCase()==="smiles" || header[i].toLowerCase() === "path_notation")continue;
			
			
            chem.setProperty(header[i],val);
          }
          ret.addChemical(chem);
          return chem;
        })
        .filter(f=>f!=null);
      
      return ret;
   };
   ret.computeNewProperty=function(prop, calc, decorate){
      return new Promise(ok => {
          let t=ret.getChems().length;
          let left=t;
          let markNext = ()=>{
			  left--;
			  if(left<=0){
				ret._properties[prop]={count:t, order: ret._propertyOrder.length-1};
				ok();
			  }
          };
          if(decorate){
             ret._decorateProperty=prop;
          }
          if(!ret._properties[prop]){
             ret._propertyOrder.push(prop);
          }
          ret.getChems().map(c=>{
             if(decorate){
                if(decorate<0){
                   c.computeContributions(c2=>-calc(c2));
                }else{
                   c.computeContributions(calc);
                }
             }
			 var res=calc(c);
			 if(JSChemify.Util.isPromise(res)){
				res.then(rr=>{
				c.setProperty(prop,rr);
				markNext();
				});
			 }else{
					c.setProperty(prop,res);
				markNext();
			 }
          });
         
          
      });
   };
   ret.hideProperty=function(prop){
      ret._properties[prop].hidden=true;
      ret._propertyOrder=ret._propertyOrder.filter(pp=>!ret._properties[pp].hidden);
      return ret;
   };
   ret.showProperty=function(prop){
      ret._properties[prop].hidden=false;
      ret._propertyOrder=ret._propertyOrder.filter(pp=>!ret._properties[pp].hidden);
      return ret;
   };
   ret.removeProperty=function(prop){
      ret.getChems().map(cc=>{
         cc.removeProperty(prop);
         if(ret._decorateProperty === prop){
            console.log("deleting annotations");
            cc.deleteAnnotations();
         }
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
         
         let chems= ret.getChems();
         if(builder._map){
            chems=chems.map(builder._map);
         }
     let outputOrder=Object.keys(ret._properties)
                       .sort((a,b)=>ret._properties[a].order-ret._properties[b].order);
         let headerProps=outputOrder
                                        .map(po=>{
                                             if(po.toLowerCase()==="smiles"){
                                                return "verbatim_" + po;
                                             }
                                             return po;
                                        })
                                        .join("\t");
         //TODO: need to think about computed properties
         let header="SMILES    Name    "+headerProps;
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
               return smiMaker(c) + "\t" + pathNotationMaker(c) +"\t"+ c.getName()+"\t" + c.getProperties(outputOrder).join("\t").replace(/\n/g,"\\n");
            }else{
               return smiMaker(c) + "\t" + c.getName()+"\t" + c.getProperties(outputOrder).join("\t").replace(/\n/g,"\\n");
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
         let chems= ret.getChems();
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
      let size= (/[0-9]*/y.exec(ret.font.trim())[0])-0;
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
      let p = ret._path.map(pp=>pp.map(f=>{
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
      //        ctx.arc(loc[0], loc[1], clearRad, 0, 2 * Math.PI);
      cx=cx-rad*0.7;
      cy=cy-rad*0.7;
      ret.moveTo(cx,cy);
      //A 100 100 0 1 0 100 122
      let nudge=rad/1000;
      ret._path.push(["A", rad,rad,0,1,0,cx+nudge,cy-nudge, "Z"]);
      return ret;
   };
   
   ret.fill=function(){
      //<path d="M150 0 L75 200 L225 200 Z" style="fill:none;stroke:green;stroke-width:3" />
      let p = ret._path.map(pp=>pp.map(f=>{
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
      let pelm = '<text x="' + x + '" y="' + y + '" style="font: ' + ret.font +';fill: ' +ret.fillStyle + ';">' + txt + '</text>';
      ret._components.push(pelm);
      return ret;
   };
   ret.toSVG=function(){
      let insert=ret._components.join("\n");
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
  let ret={};
  
  ret._labelSize=0.50;
  ret._clearRad=1.9;
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
  ret._aromaticCircles=true;
  
  ret._highlightBondItself=false;
  ret._highlightBondHalo=true;
  ret._highlightBondHaloWidth=6;

  ret._highlightAtomItself=false;
  ret._highlightAtomHalo=true;
  ret._highlightAtomHaloRadius=1;
  
   
  ret._colorGradient=[
//     {color:"red", value:0},
//     {color:"yellow", value:0.5},
//     {color:"green", value:1},
     {color:"rgba(255,0,0,0.5)", value:0.0},
     {color:"rgba(255,255,0,0.025)", value:0.5},
     {color:"rgba(0,255,0,0.5)", value:1},
     ];

  
  ret.sampleGradient=function(v){
     let pcol=null;
     let ncol=null;
     for(let i=0;i<ret._colorGradient.length;i++){
         ncol=ret._colorGradient[i];
         if(ncol.value>v || i===ret._colorGradient.length-1){
            break;
         }
         
         pcol=ncol;
     }
     let nv=(v-pcol.value)/(ncol.value-pcol.value);
     
     let icol=JSChemify.ColorUtils()
              .interpolate(pcol.color,ncol.color,nv);
     
     return JSChemify.Color(icol);
  };
  
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
      let cos=Math.cos(ret._ang);
      let sin=Math.sin(ret._ang);
      
      for(var i=0;i<=ret._dcount;i++){
          let rat=i/ret._dcount;
          let max=rat*(sin-ret._swid)+ret._swid;
          let xp=rat*(cos);
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
     let pad=10;
     const bbox=chem.getBoundingBox();
     //make room for some letters and 
     //stuff
     //TODO: improve this
     bbox[0]=bbox[0]-1;
     bbox[1]=bbox[1]-1;
     bbox[2]=bbox[2]+1;
     bbox[3]=bbox[3]+1;
     let cheight=bbox[3]-bbox[1];
     let cwidth=bbox[2]-bbox[0];
       
     let nwidth=cwidth*scale;
     let nheight=cheight*scale;
     
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
     let centX=maxWidth/2;
     let centY=maxHeight/2;
     let ocX=scale*(bbox[2]-bbox[0])/2;
     let ocY=scale*(bbox[3]-bbox[1])/2;
     //TODO: I don't know why 4 works here
     // but seems to make the spacing okay?
     // probably a bug in the affine transform 
     // implementation
     let padX=4*(centX-ocX);
     let padY=4*(centY-ocY);
     
     let nret={chem:chem, scale:scale, maxWidth:maxWidth, maxHeight:maxHeight, padX:padX,padY:padY, bbox:bbox};
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
     ret.render(imgDim.chem,ctx,imgDim.padX,imgDim.padY,imgDim.scale);
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
     ret.render(imgDim.chem,ctx,imgDim.padX,imgDim.padY,imgDim.scale);
     let svg= ctx.toSVG();
     return svg;
     //return ret.cropRawSVG(svg);
  };
  //TODO: Consider for headless cases
  ret.cropRawSVG= function(svgText) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, "image/svg+xml");
      const svg = doc.querySelector('svg');
    
      if (!svg) {
        throw new Error("No <svg> element found");
      }
    
      // Temporarily add SVG to the DOM (hidden) for getBBox to work
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'position: absolute; visibility: hidden; width: 0; height: 0; overflow: hidden;';
      document.body.appendChild(wrapper);
      wrapper.appendChild(svg);
    
      // Get bounding box of all content inside the SVG
      const bbox = svg.getBBox();
    
      // Remove wrapper & SVG from DOM
      document.body.removeChild(wrapper);
    
      // Set viewBox to the tight bounds
      svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
    
      // Optionally update width and height attributes to match bounding box
      svg.setAttribute('width', bbox.width);
      svg.setAttribute('height', bbox.height);
    
      // Serialize back to SVG string
      return new XMLSerializer().serializeToString(svg);
  };

  ret.getColorForNumber=function(n){
      
  };

  ret.getStyleFor=function(at){
      let sym= at.getSymbol();
      let style=ret._colorScheme.symbols[sym];
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
               if(Math.abs(dig-0)<=3 && Math.abs(dig-0)>0){
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

         let annotate=chem.getAnnotations();

         // There are 2 kinds of annotations:
         //   atoms
         //   bonds
         // And there are 2 ways to annotate:
         //   Categorical
         //   Numeric
         //
         // There are then different ways to highlight these
         //   coloring of bonds/atoms
         //   highlight "blob" behind bonds/atoms
         //   showing text labels near atoms/bonds
         //  
         // And, for each of these, there are different specifics
         //   what colors are chosen when categorical? What
         //   about continuous?
         //   
         // For now, we'll simplify and assume all annotations
         // are continuous numbers, and that these numbers
         // have a min, and a max. That min/max can be given
         // or calculated if not given.
         // A LACK of an annotation means we draw nothing
         // If an annotation is present, for an atom, we 
         // convert that annotation to a number between
         // 0 and 1, by using an-min/(max-min). Then,
         // we lookup the gradient color in the renderer
         // and render accordingly
     
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
         const clearRad=offx*ret._clearRad;
         const wedge=ret._getWedge();
         const dash=ret._getDash();
         const bwidth=ret._bracketWidth*scale;
         // Set line width
         ctx.lineWidth = scale*ret._lineWidth;  

         const kerning=ret._letterSpace*scale/30;
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
              let oldX=ppoint[0][0];
              let oldY=ppoint[0][1];
              let mid=[oldX+(x-oldX)/2,oldY+(y-oldY)/2];
              
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
         let hide={};
         chem.getSGroups()
            .flatMap(sg=>sg.getHiddenAtoms())
            .map(aa=>aa.getIndexInParent())
            .map(ai=>{
               hide[ai]=true;
            });
         //get aromatic circles
         let drawCircles=[];
         let circleAromaticBonds={};
         if(ret._aromaticCircles){
            let arings=chem.getRingSystems()
                            .flatMap(rs=>rs.getRings())
                            .filter(r=>r.isExplicitlyAromatic());
            arings.flatMap(rr=>rr.getBonds())
                  .map(b=>circleAromaticBonds[b.getIndexInParent()]=true);
            
            drawCircles=arings.map(rr=>{
               let pt=rr.getCenterPoint();
               let sqRad=rr.getBonds()
                 .map(b=>b.getCenterPoint())
                 .map(bb=>JSChemify.Util.sqDist(bb,pt))
                 .reduce((a,b)=>(a<b)?a:b);
              return [pt,Math.sqrt(sqRad)-ret._dblWidth];
            });
                
         }
         if(annotate && annotate.bonds && ret._highlightBondHalo){
               let owidth=ctx.lineWidth;
               let bondHaloWidth=ret._highlightBondHaloWidth*ctx.lineWidth;
               ctx.lineWidth=bondHaloWidth;
               let abonds=Object.keys(annotate.bonds).map(i=>annotate.bonds[i]);
               let minV=(annotate.bondMin||annotate.bondMin===0)?annotate.bondMin:
                           annotate.bonds.reduce((a,b)=>Math.min(a,b));
               let maxV=(annotate.bondMax||annotate.bondMax===0)?annotate.bondMax:
                           annotate.bonds.reduce((a,b)=>Math.max(a,b));
               if(maxV-minV>0){
               Object.keys(annotate.bonds)
                     .map((i)=>{
                           let bb=chem.getBond(i);
                           let v=annotate.bonds[i];
                           if(hide[bb.getAtom1().getIndexInParent()] || 
                              hide[bb.getAtom2().getIndexInParent()]){  
                              return;
                           }
                           let scaleV=(v-minV)/(maxV-minV);
                           //scaleV=0.5;
                           let hex=ret.sampleGradient(scaleV).toHex();
                           const seg=affine.transform(bb.getLineSegment());
                           
                           ctx.strokeStyle=hex;
                           ctx.beginPath();
                           moveTo(seg[0][0], seg[0][1]);
                           lineTo(seg[1][0], seg[1][1]);
                           ctx.stroke();
                     });
               ctx.lineWidth=owidth;
               }
         }
         let atomHalos={};
         if(annotate && annotate.atoms && ret._highlightAtomHalo){
               let atomHaloRadius=ret._highlightAtomHaloRadius*clearRad;
               let ostyle=ctx.fillStyle;
               let aatoms=Object.keys(annotate.atoms).map(i=>annotate.atoms[i]);
               let minV=(annotate.atomMin||annotate.atomMin===0)?annotate.atomMin:
                           annotate.atoms.reduce((a,b)=>Math.min(a,b));
               let maxV=(annotate.atomMax||annotate.atomMax===0)?annotate.atomMax:
                           annotate.atoms.reduce((a,b)=>Math.max(a,b));
               if(maxV-minV>0){
               Object.keys(annotate.atoms)
                     .map((i)=>{
                           let aa=chem.getAtom(i);
                           let v=annotate.atoms[i];
                           if(hide[i]){  
                              return;
                           }
                           let scaleV=(v-minV)/(maxV-minV);
                           let hex=ret.sampleGradient(scaleV).toHex();
                           const loc=affine.transform(aa.getPoint());
                           ctx.fillStyle = hex;
                           ctx.beginPath();
                           ctx.arc(loc[0], loc[1], clearRad, 0, 2 * Math.PI);
                           ctx.fill();
                           atomHalos[i]={"loc":loc, style:hex, rad:atomHaloRadius};
                     });
               ctx.fillStyle=ostyle;
               }
         }
         let done=[];

         let showIndexes={};
         let showAtoms=chem.getAtoms().map(at=>{
                const sym=at.getSymbol();
                const atomIdx=at.getIndexInParent();
                if(hide[atomIdx]){  
                   return;
                }
                if(sym!=="C" || at.getCharge() || at.getIsotope()){
                   showIndexes[atomIdx]=true;
                }
         });
     
         //draw bonds
         chem.getBonds().map(b=>{

            if(hide[b.getAtom1().getIndexInParent()] || 
               hide[b.getAtom2().getIndexInParent()]){  
             return;
            }
            
            const seg=affine.transform(b.getLineSegment());
            
            const dseg=[seg[0][0]-seg[1][0],seg[0][1]-seg[1][1]];
            
            if(showIndexes[b.getAtom1().getIndexInParent()] || showIndexes[b.getAtom2().getIndexInParent()]){
                  let sp=seg[0];
                  let delt=[seg[0][0]-seg[1][0],seg[0][1]-seg[1][1]];
                  let uv=JSChemify.Util.normVector(delt);
                  let mag=JSChemify.Util.magVector(delt);
                  if(showIndexes[b.getAtom1().getIndexInParent()]){
                     sp[0]=sp[0] - uv[0]*(clearRad);
                     sp[1]=sp[1] - uv[1]*(clearRad);
                     seg[0]=sp;
                     mag=mag-clearRad;
                  }
                  if(showIndexes[b.getAtom2().getIndexInParent()]){
                     let op=seg[1];
                     op[0]=op[0] + uv[0]*clearRad;
                     op[1]=op[1] + uv[1]*clearRad;
                     seg[1]=op;
                  }
                  
            }
            
            let over=false;
            over=done.map(ss=>JSChemify.ShapeUtils().getIntersectionSegmentsCoeffs(seg,ss))
                     .filter(cc=>cc!==null)
                     .findIndex(cc=>cc[0]>0.2&&cc[0]<0.8) //only center-ish overlaps matter
                     >=0;
            done.push(seg);
            
            const bo = b.getBondOrder();
            const rej=[-ret._dblWidth*dseg[1],
                        ret._dblWidth*dseg[0]];

            if(over){
                  //TODO: SVG doesn't really do this. You'd need to use a mask.
                  //we could do this, but we'd need to add anything of this
                  //nature to a global mask, and make sure to point all elements
                  //to it. Also, we'd need to switch white to be black
                  ctx.globalCompositeOperation = "destination-out";
                  let owid=ctx.lineWidth;
                  let bondHaloWidth=ret._highlightBondHaloWidth*ctx.lineWidth;
                  ctx.lineWidth=bondHaloWidth;
                  ctx.strokeStyle="white";
                  ctx.beginPath();
                  let overSpace=0.2;
                  moveTo(seg[0][0]-overSpace*dseg[0], seg[0][1]-overSpace*dseg[1]);
                  lineTo(seg[1][0]+overSpace*dseg[0], seg[1][1]+overSpace*dseg[1]);
                  ctx.stroke(); 
                  ctx.lineWidth=owid;
                  ctx.globalCompositeOperation = "source-over";
            }
            
            let short=ret._dblShort;
            let dblEither=false;
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
                      ctx.beginPath();
                      ctx.moveTo(nwedge[0][0],nwedge[0][1]);
                      nwedge.map(w=>ctx.lineTo(w[0],w[1]));
                      ctx.closePath();
                      ctx.fill();
                      return;
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
                      return;
                   }else if(b.getBondStereo()===
                      JSChemify.CONSTANTS.BOND_STEREO_EITHER){
                      dblEither=true;
                   }
            }
            let rej2=rej.map(r=>r);
            if(bo===2 || bo===4){
                //If the double bond is NOT in a ring
                //center it
                if(!b.isInRing() || dblEither){
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
                                       b.getAtom1().getPoint(),
                                       centerR);
                  const bVec=b.getDeltaVector();
                  const dd=JSChemify.Util.rejDotVector(dVec,bVec);
                  
                  if(dd>0){
                      rej[0]=-rej[0];
                      rej[1]=-rej[1];
                      rej2[0]=-rej2[0];
                      rej2[1]=-rej2[1];
                  }
                }
                if(dblEither){
                     seg[1][0] = seg[1][0] + rej[0];
                     seg[1][1] = seg[1][1] + rej[1];
                     rej2[0]=-rej2[0];
                     rej2[1]=-rej2[1];
                }
            }
            
            
            
            ctx.beginPath();
            moveTo(seg[0][0], seg[0][1],styles[0],styles[1]);
            lineTo(seg[1][0], seg[1][1],styles[0],styles[1]);
            //ctx.closePath();
            ctx.stroke();

            if(circleAromaticBonds[b.getIndexInParent()]){
               return;
            }
            
            //Draw double bond
            if(bo===2 || bo===3 || bo===4){
              
              ctx.beginPath();
              if(bo===4){
                  let space=ret._dashSpace*scale;
                  ctx.setLineDash([space,space]);
              }
              moveTo(seg[0][0]+rej[0]-dseg[0]*short, seg[0][1]+rej[1]-dseg[1]*short,styles[0],styles[1]);
              lineTo(seg[1][0]+rej2[0]+dseg[0]*short, seg[1][1]+rej2[1]+dseg[1]*short,styles[0],styles[1]);
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

      //draw circles
      drawCircles.map(cc=>{
         ctx.beginPath();
         let loc=affine.transform(cc[0]);
         //TODO: there's an issue with arcs on SVGs,
         //should bypass and use circles
         ctx.arc(loc[0], loc[1], scale*cc[1], 0, 2 * Math.PI);
         ctx.stroke();
      });
      
      chem.getAtoms().map(at=>{
          const sym=at.getSymbol();
          const atomIdx=at.getIndexInParent();
          if(hide[atomIdx]){  
             return;
          }
          if(sym!=="C" || at.getCharge() || at.getIsotope()){
              const nv=at.getPoint();
        
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

             /*
              ctx.globalCompositeOperation = "destination-out";
              ctx.fillStyle = "white";
              ctx.beginPath();
              ctx.arc(loc[0], loc[1], clearRad, 0, 2 * Math.PI);
              ctx.fill();
             
              ctx.globalCompositeOperation = "source-over";
*/
              if(atomHalos[atomIdx]){
                  let nhal=atomHalos[atomIdx];
                  ctx.fillStyle = nhal.style;
                  ctx.beginPath();
                  ctx.arc(nhal.loc[0], nhal.loc[1], nhal.rad, 0, 2 * Math.PI);
                  ctx.fill();
              }
        
              ctx.fillStyle = ret.getStyleFor(at);
        
              if(at.getImplicitHydrogens()===0){
                  ctx.fillText(prepend+ sym+append,loc[0]-offx+nudgeDx,loc[1]-offy+nudgeDy);
              }else{
                  ctx.fillText(prepend+ sym,loc[0]-offx+nudgeDx,loc[1]-offy+nudgeDy);
              }
              
              
              if(at.getImplicitHydrogens()>0){
                const h=at.getImplicitHydrogens();
                let vec=at.getLeastOccupiedCardinalDirection();
                if(at.getBondCount()===0 && 
                   (at.getSymbol()==="O" ||
                    at.getSymbol()==="S" ||
                    at.getSymbol()==="F" ||
                    at.getSymbol()==="Br" ||
                    at.getSymbol()==="Cl" ||
                    at.getSymbol()==="I"
                   )){
                    vec=[1,0];
                }
                nv[0]=nv[0]-vec[0]*kerning;
                nv[1]=nv[1]-vec[1]*kerning;
                let ntext="H";
                if(h>1){
                  ntext+=String.fromCodePoint(8320+h);
                  if(vec[0]>0){
                    nv[0]=nv[0]-vec[0]*kerning*0.35;
                  }
                }
                  
                if(vec[0]>0){
                    nv[0]=nv[0]-vec[0]*kerning*(0.35*append.length);
                    append=[...append].reverse().join("");
                    loc=affine.transform(nv);
                    ctx.fillText(append+ntext,loc[0]-offx,loc[1]-offy);
                }else{
                    nv[0]=nv[0]-vec[0]*kerning*(0.35*(sym.length-1));
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
  ret.assertNotEquals=function(a,b,msg){
    if(!msg){
        msg= a + " does Equals " + b;
    }
        ret.assertTrue(a!==b,msg);
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
      let c=JSChemify.Chemical(a).generateCoordinates();
    let clusters=c.$getCloseClustersOfAtoms();
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
    let passed=0;
    let failed=0;
    let total=ret._tests.length;
    let whenDone=()=>{
       if(passed+failed===total){
          console.log("Tests passed:"+passed);
          console.log("Tests failed:"+failed);
       }
    };
    
    ret._tests.map((t,i)=>{
        try{
            let rr=t.test();
            if(rr instanceof Promise){
               rr.catch(e=>{
                  console.log("Test " + t.name + " Failed:" + e);
                  failed++;
                  whenDone();
               }).then(p=>{
                  passed++;
                  console.log("Test " + t.name + " Passed");
                  whenDone();
               });
            }else{
               passed++;
               console.log("Test " + t.name + " Passed");
               whenDone();
            }
         }catch(e){
             console.log("Test " + t.name + " Failed:" + e);
             failed++;
             whenDone();
         }
    });
  };
  // 
  //JSChemify.Chemical(JSChemify.Chemical("C").setProperty("abc", "val1\nval2").toSd()).toSd()
  ret.assertSmilesMolSmilesSame=function(smi){
      smi=JSChemify.Chemical(smi).toSmiles();
      let smi2=JSChemify.Chemical(smi)
         .generateCoordinates()
         .peek(c=>c.getAtoms().map(aa=>aa.setParity(0)))
         .map(c=>JSChemify.Chemical(c.toMol()))
         .toSmiles();
      ret.assertEquals(smi,smi2);
  };
  ret.assertSmilesMolSmilesDifferent=function(smi,nsmi){
      smi=JSChemify.Chemical(smi)
          .generateCoordinates()
         .peek(c=>c.getAtoms().map(aa=>aa.setParity(0)))
         .map(c=>JSChemify.Chemical(c.toMol()))
                   .toSmiles();
      let smi2=JSChemify.Chemical(nsmi)
         .generateCoordinates()
         .peek(c=>c.getAtoms().map(aa=>aa.setParity(0)))
         .map(c=>JSChemify.Chemical(c.toMol()))
         .toSmiles();
      
      ret.assertNotEquals(smi,smi2);
  };
  ret.tests.push("Linear Regression with set m and b should return correct results",()=>{
      let xs=[1,2,3,4,5,6,7,8];
      let b=41.5;
      let m=-7.3;
      let nx=xs.map(x=>[x,1]);
      let ny=nx.map(x=>[m*x[0]+b]);
      let reg=JSChemify.LinearRegression()
                         .setX(nx)
                         .setY(ny);
      let coeff=reg.calculate();
      let rr=reg.getR();
      ret.assertEquals(Math.round(m*100),Math.round(coeff[0]*100));
      ret.assertEquals(Math.round(b*100),Math.round(coeff[1]*100));
     
      ret.assertEquals(100,Math.round(rr*100));
  });
  ret.tests.push("Linear Regression with defined noise gives correct results",()=>{
      let xs=[1,2,3,4,5,6,7,8,9];
      let ys=[10,
21.00,
27.00,
34.00,
36.00,
45.00,
49.00,
62.00,
61.00];
     
      let b=6.5;
      let m=6.37;
      let nx=xs.map(x=>[x,1]);
      let ny=ys.map(y=>[y]);
      let reg=JSChemify.LinearRegression()
                         .setX(nx)
                         .setY(ny);
      let coeff=reg.calculate();
      let rr=reg.getRSquared();
      ret.assertEquals(Math.round(m*100),Math.round(coeff[0]*100));
      ret.assertEquals(Math.round(b*100),Math.round(coeff[1]*100));
     
      ret.assertEquals(98,Math.round(rr*100));
  });
   //C(=O)(N(CC2(C)C)[C@@]1([H])S2)C1
  ret.tests.push("Line intersections",()=>{
      let inter=JSChemify.ShapeUtils().getIntersectionSegments([[1,1],[0,0]],[[1,0],[0,1]]);
      ret.assertToStringEquals([0.5,0.5],inter);
  });
  ret.tests.push("Base64 Parity Test works",()=>{
      let atorv="H4sIAAAAAAAAA6VWS44UMQzd9ylyASJ/4jhZzwwLJIYFEjcAwYIDcHucxKmullhQ7lEv6o0rrxy/Zye3T19ffn7//evHH" +
                "4CGSAW7AL3ebqlgKiUlOP3Of5C+EQDc7PEDZeJG66ki1RnPFoX0kh4p/v2bLJAblbpYRIueWN7/nwWzCJXFAo0klgvmLo" +
                "TjiXOhplEWUGrOgthjLJR7F98RqmC0uiawbLU4mAtnrYiuNDSOaQSZqcDia6ItlEuyXFS7+6VjzHWpZKGqXl1WimqkRHt" +
                "HBYMa3ZXGTF3OrvtyqQNqZ2cBju3IVqgwuNLSghpZdQHFc6mEoR2Z0uZd2B0AwVzM95XZd0QSVNq8CzRdV3LVElPaVjAT" + 
                "PztfrLoIT9fFphRy8x0V4BiLmGP33JXHnr6gNObS2VkIgnWxFb2rT+9GrYQ1Ep3elQy1x04S21FVQGdp9Vzdj1e82zvSk" + 
                "5NhVFfXrEPzH9cQy3TsOqef8a5NTIDdRxg91UZPq66+VIie9uYXXLPuGRbrRhbXiEsNzhfJWKtPKXlU+tI5zW0pXXJv0f" + 
                "OoZMQii08fvXtpR4377mmk4M3D5gvMaTvUqhzr6ZGL1K1Rj95Ui3XydOzQvELIL5aE1RMXWE+0QJnAIzKxR+o5ovPfDto" + 
                "ODtDnsgUQEuoBcOANaH9qAJ4E6ztYTrmN0/tOUAfHfk0TtiPSEt3Z+kxigXEt6nvNuAEca4jS6DWP8KT2SJnfdSCTw0Gd" + 
                "7L5GB8f+qIFFjZOA+gbW2ni8xjjBIrDLER5Z293gBMrM1YFM4Gvq4NgRHew70sabO9IHh0fssstHQczFfNQ6yUnGEdFzd" + 
                "Q5NB0HzNZ9Tent//Qv0plR7uQ0AAA==";
      return new Promise((ok,bad)=>{
         JSChemify.Chemical().fromBase64GzippedMolPromise(atorv)
                             .then(c=>{
                                let smi = c.toSmiles();
                                let esmi= "C1(=C(N(CC[C@H](C[C@H](CC(=O)O)O)O)C(=C(1)C1(C=CC=CC=1))C1(C=CC(=CC=1)F))C(C)C)C(NC1(C=CC=CC=1))=O";
                                ret.assertSameSmiles(smi,esmi);
                                ret.assertEquals(c.getAtoms().filter(at=>at.getParity()!==0).length,2);
                                ok();
                             }).catch(e=>{
                               bad(e); 
                             });
      });
     
  });
   ret.tests.push("E/Z generate coordinates on toSmiles preserved cis",()=>{
      let omol=`
  -INDIGO-12142417232D

  4  3  0  0  0  0  0  0  0  0999 V2000
    7.3157   -8.0735    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    7.9818   -7.5985    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    8.9818   -7.5985    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    9.5068   -8.1325    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  2  0  0  0  0
  3  4  1  0  0  0  0
M  END
`;
      let nsmi=JSChemify.Chemical(omol)
         .peek(c=>c.getBonds().map(bb=>bb.setBondGeometry(0)))
         .generateCoordinates()
         .toSmiles();
      let expected1="C/C=C\\C";
      let expected2="C\\C=C/C";

      try{
         ret.assertEquals(nsmi,expected1);
      }catch(e){
         ret.assertEquals(nsmi,expected2);
      }
  });
  ret.tests.push("E/Z on toSmiles preserved cis",()=>{
      let omol=`
  -INDIGO-12142417232D

  4  3  0  0  0  0  0  0  0  0999 V2000
    7.3157   -8.0735    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    7.9818   -7.5985    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    8.9818   -7.5985    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    9.5068   -8.1325    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  2  0  0  0  0
  3  4  1  0  0  0  0
M  END
`;
      let nsmi=JSChemify.Chemical(omol).toSmiles();
      let expected1="C/C=C\\C";
      let expected2="C\\C=C/C";

      try{
         ret.assertEquals(nsmi,expected1);
      }catch(e){
         ret.assertEquals(nsmi,expected2);
      }
  });
  ret.tests.push("E/Z on toSmiles preserved trans",()=>{
      let omol=`
  -INDIGO-12142417312D

  4  3  0  0  0  0  0  0  0  0999 V2000
    7.7487   -5.8735    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    8.7487   -5.8735    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    7.2487   -6.7395    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    9.2487   -5.0075    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  1  3  1  0  0  0  0
  2  4  1  0  0  0  0
M  END
`;
      let nsmi=JSChemify.Chemical(omol).toSmiles();
     //TODO: consider if this makes sense
      let expected1="C(=C/C)\\C";
      let expected2="C(=C\\C)/C";
     

      try{
         ret.assertEquals(nsmi,expected1);
      }catch(e){
         ret.assertEquals(nsmi,expected2);
      }
  });
  ret.tests.push("parse E/Z same on smiles preserved",()=>{
      let osmi="F/C=C/F";
      let nsmi=JSChemify.Chemical(osmi).toSmiles();
      ret.assertEquals(nsmi,osmi);
  });
  ret.tests.push("parse E/Z opposite on smiles preserved",()=>{
      let osmi="F/C=C\\F";
      let nsmi=JSChemify.Chemical(osmi).toSmiles();
      ret.assertEquals(nsmi,osmi);
  });
   
  ret.tests.push("stereo parity in ring system preserved",()=>{
      ret.assertSmilesMolSmilesSame("C(=O)(N(CC2(C)C)[C@]1([H])S2)C1");
     
      ret.assertSmilesMolSmilesSame("C(=O)(N(CC2(C)C)[C@@]1([H])S2)C1");
      ret.assertSmilesMolSmilesDifferent("C(=O)(N(CC2(C)C)[C@@]1([H])S2)C1","C(=O)(N(CC2(C)C)[C@]1([H])S2)C1");
     
  });
 
  ret.tests.push("simple stereo parity with 4 members preseved in smiles",()=>{
      ret.assertSmilesMolSmilesSame("O[C@@](S)(P)C");
  });
  ret.tests.push("simple stereo parity with 4 members preseved in smiles",()=>{
      ret.assertSmilesMolSmilesSame("O[C@](S)(P)C");
  });
  ret.tests.push("simple stereo parity cis/trans ring preserved in smiles",()=>{
      ret.assertSmilesMolSmilesSame("C1(C[C@H](C)CC[C@@H](1)C)");
      ret.assertSmilesMolSmilesSame("C1(C[C@@H](C)CC[C@@H](1)C)");
  });
  ret.tests.push("simple stereo parity with 3 members preseved in smiles=>mol=>smiles",()=>{
      let smi="CCCCC[C@@H](S)O";
      let smi2=JSChemify.Chemical(smi)
         .generateCoordinates()
         .peek(c=>c.getAtoms().map(aa=>aa.setParity(0)))
         .map(c=>JSChemify.Chemical(c.toMol()))
         .toSmiles();
      ret.assertEquals(smi,smi2);
  });
  ret.tests.push("simple stereo parity with 3 members preseved in smiles",()=>{
      let smi="CCCCC[C@@H](S)O";
      let smi2=JSChemify.Chemical(smi)
         .generateCoordinates()
         .peek(c=>c.getAtoms().map(aa=>aa.setParity(0)))
         .toSmiles();
      ret.assertEquals(smi,smi2);
  });
  ret.tests.push("simple inverted stereo parity with 3 members preseved in smiles",()=>{
      let smi="CCCCC[C@H](S)O";
      let smi2=JSChemify.Chemical(smi)
         .generateCoordinates()
         .peek(c=>c.getAtoms().map(aa=>aa.setParity(0)))
         .toSmiles();
      ret.assertEquals(smi,smi2);
  });
  ret.tests.push(()=>{
      let sgroup=JSChemify.Chemical("O([B](F)(F)F)[Si](N)(C)C [L2M74R4m61Fm61L4m61Fm83](n)FM65L4R4").getSGroups()[0];
      ret.assertEquals(4,sgroup.getAtoms().length);
  });
  ret.tests.push(()=>{
      let input="C1(=O)(N2(C(C(SC([H])2C(NC(CCCC(C(=O)O)N)=O)1)(C)C)C(O)=O)) r6m80Fm80L11.3m94R5.8M94Rl4M60r4m60R4m60Fm60FR12LRLRLLRRRR4L24L5LRL7M90r6m80";
      let c = JSChemify.Chemical(input);
      let c2=JSChemify.Chemical(c.toMol());
      let smipp=c2.toSmilesPP();
      ret.assertEquals(smipp,input);
  });
  ret.tests.push(()=>{
      let input="C1(C(C2(CCCCC2)C)CCC1) r4M60LRLLLLLl6R5R5R5R5";
      let c = JSChemify.Chemical(input);
      let c2=JSChemify.Chemical(c.toMol());
      let smipp=c2.toSmilesPP();
      ret.assertEquals(smipp,input);
  });
  //C14(C(C2(CCC3(=C(C(CC1)(H)2)C=CC(O)=C3))(H))(CCC(4)O)H)C L3.9m80L6.5m96R6.2M96LLLLRLLR8L5L5L5R3m80WR7HR3HL3m80WLR3HRRRLRR
  ret.tests.push(()=>{
      let nonConvex=[[0,0],[1,0],[1,1],[0,1]];
      let convex=[[0,0],[1,0],[1,1],[0,1]];
    
      let nconvex=JSChemify.ShapeUtils().convexHull(nonConvex);
      ret.assertToStringEquals(nconvex,convex);
  });
  ret.tests.push(()=>{
      let nonConvex=[[0,0],[1,0],[0.9,0.5],[1,1],[0,1]];
      let convex=[[0,0],[1,0],[1,1],[0,1]];
    
      let nconvex=JSChemify.ShapeUtils().convexHull(nonConvex);
      ret.assertToStringEquals(nconvex,convex);
  });
  ret.tests.push(()=>{
      let nonConvex=[[0,0],[1,1],[1,0],[0,1]];
      let convex=[[0,0],[1,0],[1,1],[0,1]];
    
      let nconvex=JSChemify.ShapeUtils().convexHull(nonConvex);
      ret.assertToStringEquals(nconvex,convex);
  });
  ret.tests.push(()=>{
      let nonConvex=[[0.1214,0.33123],[0,0],[0.27,0.99],[0.11,0.36],[1,1],[1,0],[0,1],[0.11,0.37],[0.82,0.22222]];
      let convex=JSChemify.ShapeUtils().canonicalPathCCW([[0,0],[1,0],[1,1],[0,1]]);
      let nconvex=JSChemify.ShapeUtils().canonicalPathCCW(JSChemify.ShapeUtils().convexHull(nonConvex));
      ret.assertToStringEquals(nconvex,convex);
  });
  ret.tests.push(()=>{
      let nonConvex=[[0,0],[0,0],[1,1],[1,0],[0,1]];
      let convex=JSChemify.ShapeUtils().canonicalPathCCW([[0,0],[1,0],[1,1],[0,1]]);
      let nconvex=JSChemify.ShapeUtils().canonicalPathCCW(JSChemify.ShapeUtils().convexHull(nonConvex));
      ret.assertToStringEquals(nconvex,convex);
  });
  ret.tests.push(()=>{
      let nonConvex=[[0,0],[0.5,0.5],[0.25,0.25],[1,1],[1,0],[0,1]];
      let convex=JSChemify.ShapeUtils().canonicalPathCCW([[0,0],[1,0],[1,1],[0,1]]);
      let nconvex=JSChemify.ShapeUtils().canonicalPathCCW(JSChemify.ShapeUtils().convexHull(nonConvex));
      ret.assertToStringEquals(nconvex,convex);
  }); 
  ret.tests.push(()=>{
      let nonConvex=[[0,0],[1,1],[1,0],[1,0.25],[1,0.1],[0,1]];
      let convex=JSChemify.ShapeUtils().canonicalPathCCW([[0,0],[1,0],[1,1],[0,1]]);
      let nconvex=JSChemify.ShapeUtils().canonicalPathCCW(JSChemify.ShapeUtils().convexHull(nonConvex));
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
    let osmi= "[11CH2+2]";
    let nsmi=JSChemify.Chemical(JSChemify.Chemical(osmi).toSd()).toSmiles();
    ret.assertEquals(osmi,nsmi);
  });
  ret.tests.push(()=>{
    let chem1 = JSChemify.Chemical("C(=CC=C1)C(=C1N=2)N(C2)C.CCCC.O");
    let split=chem1.getComponents();
    ret.assertTrue(split.length===3,"split components should have 3 chemicals if 3 molecules");
    let splitSmiles=split.map(cc=>cc.toSmiles()).join(".");
    let oSmiles=chem1.toSmiles();
    ret.assertEquals(splitSmiles,oSmiles);
  });
  ret.tests.push(()=>{
    let chem1 = JSChemify.Chemical("C(=CC=C1)C(=C1N=2)N(C2)C");
    ret.assertTrue(!chem1.hasCoordinates(),"first read smiles shouldn't hae coordinates");
    chem1.generateCoordinates();
    ret.assertTrue(chem1.hasCoordinates(),"recently generated chem should have coordinates");
    
  });
  ret.tests.push(()=>{
    let chem1 = JSChemify.Chemical("C(=CC=C1)C(=C1N=2)N(C2)C");
    chem1.setProperty("Test",123);
    chem1.setName("test");
    chem1.generateCoordinates();
    let chem2 = chem1.clone();
    let oldMol=chem1.toSd();
    ret.assertEquals(oldMol,chem2.toSd());
    chem1.aromatize();
    chem1.setProperty("Another", 2);
    ret.assertEquals(oldMol,chem2.toSd());
  });
  ret.tests.push(()=>{
      let wt=JSChemify.Chemical("C[C@]12CC[C@H]3[C@H]([C@@H]1CC[C@@H]2O)CCC4=CC(=O)CC[C@]34C").getMolWeight();
    wt=Math.round(wt * 100) / 100;
      ret.assertEquals(288.40,wt);
  });
  ret.tests.push(()=>{
      let form=JSChemify.Chemical("C[C@]12CC[C@H]3[C@H]([C@@H]1CC[C@@H]2O)CCC4=CC(=O)CC[C@]34C").getMolFormula();
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
  
  ret.tests.push("Smiles stereo not inverted on ring locants simple case", ()=>{
      let smi1 = "CCCCP[C@]1([H])(CN[C@@H](C)C2(=CC=CC(=C2)OC2(=CC=C(C[C@H](CN1)N)C=C2)))";
      let chem1 = JSChemify.Chemical(smi1);
      ret.assertEquals(smi1,chem1.toSmiles());
  });
  ret.tests.push("Smiles stereo not inverted on ring locants complex case", ()=>{
      let smi1 = "C(CCCCCCC(=O)N[C@@H]1([C@H](OC2(=C3(C=C4([C@@H](NC(=O)[C@H]5(NC(=O)[C@@H](CC6(=CC=C(O3)C=C6))NC([C@H]([N:1](C)N=O)C3(C=C(OC6(C=C5C(=C(C=6)O)Cl))C(=CC=3)O))=O))C(N[C@@H]3(C5(C=C(C6(=C(C=C(O)C=C6[C@H](NC([C@H]([C@@H](C6(=CC=C(OC2=C4)C(=C6)Cl))O)NC3=O)=O)C(=O)NCCCN(C)C)O[C@@H]2([C@@H](O)[C@@H](O)[C@H](O)[C@H](O2)CO)))C(O)=CC=5)))=O))))O[C@H](C(=O)O)[C@H]([C@@H]1O)O))C(C)C";
      let chem1 = JSChemify.Chemical(smi1);
      ret.assertEquals(smi1,chem1.toSmiles());
  });
  
  ret.tests.push("Basic MOL V3000 support works and gets correct InChI", ()=>{
      let ibuprofSodium=`
  -INDIGO-06172512432D

  0  0  0  0  0  0  0  0  0  0  0 V3000
M  V30 BEGIN CTAB
M  V30 COUNTS 18 15 1 0 0
M  V30 BEGIN ATOM
M  V30 1 C 15.4592 -7.623 0.0 0
M  V30 2 O 16.2394 -6.2646 0.0 0 CHG=-1
M  V30 3 O 13.9081 -7.623 0.0 0
M  V30 4 C 16.2394 -8.9904 0.0 0
M  V30 5 C 17.8431 -8.9904 0.0 0
M  V30 6 C 18.6053 -10.3397 0.0 0
M  V30 7 C 20.1566 -10.3397 0.0 0
M  V30 8 C 20.9366 -8.9904 0.0 0
M  V30 9 C 20.1829 -7.623 0.0 0
M  V30 10 C 18.6229 -7.623 0.0 0
M  V30 11 C 22.4966 -8.9904 0.0 0
M  V30 12 C 23.3203 -7.6754 0.0 0
M  V30 13 C 24.8803 -7.6754 0.0 0
M  V30 14 C 22.5403 -6.2646 0.0 0
M  V30 15 C 15.4592 -10.3397 0.0 0
M  V30 16 Na 18.3206 -3.7013 0.0 0 CHG=1
M  V30 17 O 29.8909 -7.8409 0.0 0
M  V30 18 O 29.8909 -7.8409 0.0 0
M  V30 END ATOM
M  V30 BEGIN BOND
M  V30 1 2 3 1
M  V30 2 1 4 1
M  V30 3 1 5 4
M  V30 4 2 6 5
M  V30 5 1 7 6
M  V30 6 2 8 7
M  V30 7 1 8 9
M  V30 8 2 9 10
M  V30 9 1 10 5
M  V30 10 1 11 8
M  V30 11 1 12 11
M  V30 12 1 13 12
M  V30 13 1 14 12
M  V30 14 1 4 15
M  V30 15 1 2 1
M  V30 END BOND
M  V30 BEGIN SGROUP
M  V30 1 MUL 1 ATOMS=(2 17 18) BRKXYZ=(9 29.390930 -8.340900 0.000000 29.3909-
M  V30 30 -7.340900 0.000000 0.000000 0.000000 0.000000) BRKXYZ=(9 30.390930 -
M  V30 -7.340900 0.000000 30.390930 -8.340900 0.000000 0.000000 0.000000 0.00-
M  V30 0000) PATOMS=(1 17) MULT=2
M  V30 END SGROUP
M  V30 END CTAB
M  END`;
      return new Promise((ok,bad)=>{
         JSChemify.Chemical(ibuprofSodium)
                             .toInChIKeyPromise()
                             .then(inchi=>{
                                ret.assertEquals("VTGPMVCGAVZLQI-UHFFFAOYSA-M",inchi);
                                ok();
                             }).catch(e=>{
                               bad(e); 
                             });
      });
  });
  
  //
  
  // TODO: this one fails right now
  // but we could fix it
  
  ret.tests.push("Triphenyl 4-bond Phosphorous Clean",()=>{
      ret.assertCleanCoordinates("C1=CC=C([P+](C2C=CC=CC=2)(CCCC#N)C2C=CC=CC=2)C=C1");
  });
  
  ret.tests.push(()=>{
      let matrix=[[1,2,3],
                 [4,5,6],
                 [7,8,9]];
      let matrixT=[[1,4,7],
                 [2,5,8],
                 [3,6,9]];
    let tmat=JSChemify.Util.matrixTranspose(matrix);
    let smatO=tmat.map(c=>c.join(",")).join(",");
    let tmatO=matrixT.map(c=>c.join(",")).join(",");
    ret.assertEquals(smatO,tmatO);
  });
  
  ret.tests.push(()=>{
      let matrix=[[1,0,0],
                 [0,1,0],
                 [0,0,1]];
    let tmat=JSChemify.Util.matrixInverse(matrix);
    let smatO=tmat.map(c=>c.join(",")).join(",");
    let tmatO=matrix.map(c=>c.join(",")).join(",");
    ret.assertEquals(smatO,tmatO);
  });
  
  ret.tests.push(()=>{
      let matrix=[[1,1,0],
                 [0,1,0],
                 [1,0,1]];
    let ident=[[1,0,0],
                [0,1,0],
                [0,0,1]];
    let tmat=JSChemify.Util.matrixInverse(matrix);
    tmat=JSChemify.Util.matrixMultiply(tmat,matrix,true);
    let smatO=tmat.map(c=>c.join(",")).join(",");
    let tmatO=ident.map(c=>c.join(",")).join(",");
    ret.assertEquals(smatO,tmatO);
  });
  
  ret.tests.push(()=>{
      let affine=JSChemify.AffineTransformation();
    let point=[1,2];
    let npoint=affine.transform(point);
    ret.assertToStringEquals(point,npoint);
  });
  
  
  ret.tests.push(()=>{
      let affine=JSChemify.AffineTransformation();
    affine=affine.translate(1,0);
    let point=[1,2];
    let npointExp=[2,2];
    let npoint=affine.transform(point);
    ret.assertToStringEquals(npoint,npointExp);
  });
  ret.tests.push(()=>{
      let affine=JSChemify.AffineTransformation();
    affine=affine.scale(10);
    let point=[1,2];
    let npointExp=[10,20];
    let npoint=affine.transform(point);
    ret.assertToStringEquals(npoint,npointExp);
  });
  ret.tests.push(()=>{
    let affine=JSChemify.AffineTransformation();
    affine=affine.translate(10,2);
    let point=[1,2];
    let npoint=affine.transform(point);
    npoint=affine.inverse().transform(npoint);
    ret.assertToStringEquals(point,npoint);
  });
  
  ret.tests.push(()=>{
      let affine=JSChemify.AffineTransformation();
    affine=affine.scale(2).translate(10,2);
    let affine2=affine.clone().inverse();
    let nothing=affine.clone().multiply(affine2);
    
    let point=[0,0];
    let npoint=nothing.transform(point);
    ret.assertToStringEquals(point,npoint);
  });
  
  ret.tests.push(()=>{
      let affine=JSChemify.AffineTransformation();
    affine=affine.scale(2).translate(10,2);
    let affine2=affine.clone().inverse();
    let nothing=affine.clone().multiply(affine2);
    
    let point=[0,0];
    let npoint=affine.transform(point);
    npoint=affine2.transform(npoint);
    ret.assertToStringEquals(point,npoint);
  });
  
  ret.tests.push(()=>{
      let affine=JSChemify.AffineTransformation();
    affine=affine.scale(2).translate(10,2);
    let affine2=JSChemify.AffineTransformation()
                                              .translate(-10,-2)
                          .scale(0.5);
    
    let point=[0,0];
    let npoint=affine.transform(point);
    npoint=affine2.transform(npoint);
    ret.assertToStringEquals(point,npoint);
  });
  
  
  //TODO: Not sure about this one
  ret.tests.push(()=>{
      let affine=JSChemify.AffineTransformation();
    affine=affine.translate(10,2).scale(2).translate(1,1);
    let affine2=JSChemify.AffineTransformation()
                          .translate(1,1)
                          .scale(2)
                          .translate(10,2);
    
    let point=[0,0];
    let npoint=affine.transform(point);
    let npoint2=affine2.transform(point);
    ret.assertToStringNotEquals(npoint,npoint2);
  });
  
  ret.tests.push(()=>{
  
    let affine=JSChemify.Util
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
