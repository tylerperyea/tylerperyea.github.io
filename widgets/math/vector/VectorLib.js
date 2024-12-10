var VectorLib={};


VectorLib.ZERO_TOLERANCE=1E-11;
VectorLib.proj=function(d1,d2,d3){
	return (d1*d1+d2*d2-d3*d3)/(2*d2);
};
VectorLib.unitVector=function(i){
	let bb=[];
  bb.length=i+1;
  for(var j=0;j<i;j++){
  	bb[j]=0;
  }
  bb[i]=1;
  return VectorLib.Vector(bb);
};
VectorLib.randomVector=function(i){
	var bb=[];
  bb.length=i;
  for(var j=0;j<i;j++){
  	bb[j]=Math.random();
  }
  return VectorLib.Vector(bb);
};
VectorLib.identityMatrix=function(n){
	var res=[];
  res.length=n;
  for(var i=0;i<res.length;i++){
  	res[i]=[];
    res[i].length=n;
    for(var k=0;k<n;k++){
    	if(k!==i){
      	res[i][k]=0;
      }else{
      	res[i][k]=1;
      }
    }
  }
  return VectorLib.Matrix(res);
};

//TODO: Should this be a property of a metric?
//probably.
//embed metric space into euclidean space
VectorLib.embed = function(met, allowImag){
  
  var pts=[];
  var nullDims=[];
  //first thing is probably to find highest variance
  //axis. This isn't easy with metric space only,
  //but you could approximate just finding the farthest points
  
  if(met._count>=1){
  	pts[0]=VectorLib.Vector([0]); //first point is at origin
  }
  for(var i=1;i<met._count;i++){
  	if(i==1){
    	pts[i]=VectorLib.Vector([met.distance(0,1)]);
      continue;
    }
    
    var pd=met.distance(0,i);
    if(i==2){
    	var x=VectorLib.proj(pd,met.distance(0,1),met.distance(1,i));
      var v=VectorLib.Vector([x,0]);
      v._arr[i-1]=Math.sqrt(Math.max(0,pd*pd - v.sqNorm()));
      pts[i]=VectorLib.Vector(v._arr);
      continue;
    }
    //TODO
    var vb=[];
  	for(var j=1;j<i;j++){

      //each projection along the origin->i->j triangle
    	var jp=VectorLib.proj(pd,met.distance(0,j),met.distance(j,i));


      //x-axis
      if(j==1){
      	vb.push(jp);
        continue;
      }
      //Every time we add a new point, we invent a new dimension
      //So, on the 0th point we invented the origin
      //on the 1st point, we invented the x-axis (dim=0)
      //on the 2nd point, we invented the y-axis (dim=1)
      //If we look back on the jth point and see that its
      //new dimension (j-1) has 0 mag, that means all future
      //things will also have 0 mag there
      
      if(pts[j]._arr[j-1].mag()<=VectorLib.ZERO_TOLERANCE){
      	vb.push(0);
        continue;
      }

      //Get the "inventor" vector for this j dimension
      //normalize it, and scale to the projection
      //amount found for the new point
      //this is the projection vector
      var pv=pts[j].normalized().scale(jp);

      //find the set of vectors which are
      //orthogonal to that vector
      var o = pts[j].orthoBasis();

      //the null space is really the
      //same as the ortho basis, just
      //as a set of row vectors
      //I don't remember why an inverse
      //makes sense. But the null space
      //shouldn't be square ...
      var mm=pts[j].nullSpace().inverse();
      
      
      var yV=pv.negate().add(vb).slice(j-1);
		
      var solved=mm.multiply(yV);
		
      var np=pv._arr[j-1];
      
      for(var k=0;k<o.length;k++){
        //add the solved fraction of each orthogonal vector
        //to the total
	      
	      let t=o[k]._arr[o[k].dim()-1].multiply(solved._arr[k][0]);
      	np=np.add(t);
      }
		
      vb.push(np);
    }
    vb=VectorLib.Vector(vb);
    var dd=pd*pd - vb.sqNorm();
    //if dd<=0 then that means there's no new info
    //added by this point. This also means that the
    //dim should be 0 from here on out for this dim
    //TODO: if dd is negative, that means we would
    //need an imaginary dimension. Such a thing
    //may be possible to implement well, but would
    //need a better version of vectors which
    //would be complex
    
    let ddsr=Math.sqrt(Math.abs(dd));
    if(ddsr<=VectorLib.ZERO_TOLERANCE || (!allowImag && dd<0) ){
    	nullDims.push(i-1);
    }
    vb._arr[i-1]=ddsr;
    if(allowImag && dd<0){
      //imaginary dimension
      vb._arr[i-1]=VectorLib.ComplexNumber(0,ddsr);
    }
    
    pts[i]=VectorLib.Vector(vb._arr);
  }
  var keep=[];
  keep.length=pts.length;
  keep=keep.fill(1);
  nullDims.map(nd=>keep[nd]=0);
  
  var embed= VectorLib.Matrix(pts.map(p=>p.subspace(keep))
                        .map(v=>v._arr))._arr;
  return VectorLib.MetricSpace()
                   .setItems(embed.map(v=>VectorLib.Vector(v)))
                   .setDistance((a,b)=>a.add(b.negate()).norm());
  
};



/****************************

STATUS:In progress
*****************************/
VectorLib.Number=function(nn){
    if(nn && nn._isNumber)return nn;
    if(typeof nn === "string" && nn.indexOf("i")>=0){
        return VectorLib.ComplexNumber(nn);
    }
    let ret={};
    ret._isNumber=true;
    ret._priority=0;
    ret.a=(Number.isFinite(nn))?nn-0:0;

    //interface needs
    //all should return new numbers
    ret.make=function(raw){
	      return VectorLib.Number(raw);
    };
    ret.add=function(n){
        let nn=ret.make(n);
        if(nn._priority>ret._priority) return nn.add(ret);
        return ret.make(nn.a + ret.a);
    };
    ret.multiply=function(n){
        let nn=ret.make(n);
        if(nn._priority>ret._priority) return nn.multiply(ret);
        return ret.make(nn.a * ret.a);
    };
    ret.inverse=function(){
	    return ret.make(1/ret.a);
    };
    ret.scale=function(s){
	    return ret.make(s*ret.a);
    };
    ret.sqMag=function(){
	    return ret.a*ret.a;
    };
    ret.toString=function(){
	    return ret.a + "";
    };

    ret.mag=function(){
	    return Math.sqrt(ret.sqMag());
    };
    ret.subtract=function(nm2){
      let nn=ret.make(nm2);
      return ret.add(nm2.negate());
    };
    ret.negate=function(){
      return ret.scale(-1);
    };
    ret.conjugate=function(){
      return ret;
    };

    ret.pow=function(n){
      let pro=ret;
      for(let i=1;i<n;i++){
        pro=pro.multiply(ret);
      }
      return pro;
    };
    ret.max=function(o){
      if(ret.mag()>o.mag()){
        return ret;
      }
      return o;
    };
    ret.min=function(o){
      if(ret.mag()>=o.mag()){
        return o;
      }
      return ret;
    };
  
    return ret;
};

/******************************
Complex Number
===============================
STATUS: In Progresss


*******************************/
VectorLib.ComplexNumber=function(r,i){
    if(r && r._isComplex)return r;
    if(typeof r === "string" && !i){
        let comp=r.split(" ");
        comp.map(cp=>{
            if(cp.indexOf("i")>=0){
                if(cp==="i"){
                  i=1;
                }else if(cp==="-i"){
                  i=-1;
                }else{
                  i=cp.replace("i","")-0;
                }
            }else{
                r=cp-0;
            }
        });
    }
  	let ret=VectorLib.Number();
    ret._priority=1;
    ret._isComplex=true;
    ret.a=(Number.isFinite(r-0))?r-0:0;
    ret.b=(Number.isFinite(i-0))?i-0:0;
    ret.make=function(raw){
        if(raw && raw._isComplex)return raw;
        if(raw && Array.isArray(raw)){
            return VectorLib.ComplexNumber(raw[0],raw[1]);
        }
        if(raw && raw._isNumber){
            //TODO: need to think about this conversion
            return VectorLib.ComplexNumber(raw.a,0);
        }
        if(raw && typeof raw ==="string" && raw.indexOf("i")>=0){
          return VectorLib.ComplexNumber(raw);
        }
	      if(raw && Number.isFinite(raw)){
	          return VectorLib.ComplexNumber(raw-0,0); 
	      }
        
        return VectorLib.ComplexNumber(raw);
    };
    ret.add=function(r){
      let z2=ret.make(r);
      return VectorLib.ComplexNumber(ret.a+z2.a,ret.b+z2.b);
    };
    ret.multiply=function(r){
      let z2=ret.make(r);
      return VectorLib.ComplexNumber(ret.a*z2.a-ret.b*z2.b,
                                          ret.a*z2.b+ret.b*z2.a);
    };
    ret.scale=function(s){
      return VectorLib.ComplexNumber(s*ret.a,s*ret.b);
    };
    ret.sqMag=function(){
      return ret.a*ret.a+ret.b*ret.b;
    };
    
    ret.inverse=function(){
      //(a+bi)*(c+di)=1
      //ac-bd+ad+bc=1
      //ac-bd=1
      //ad+bc=0
      //d=-bc/a
      //ac+b^2ca=1
      //a(c+b^2c)=1
      //ac(1+b^2)=1
      //c=1/(a*(1+b^2))
      //this won't work if a is 0
      if(Math.abs(a)>VectorLib.ZERO_TOLERANCE){
        let c= 1/(ret.a*(1+ret.b*ret.b));
        let d= -ret.b*c/ret.a;
        return VectorLib.ComplexNumber(c,d);
      }
      let theta = Math.atan2(ret.b,ret.a);
      let mag=ret.mag();
      let c=mag*Math.cos(-theta);
      let d=mag*Math.sin(-theta);
      return VectorLib.ComplexNumber(c,d);
    };
    ret.toString=function(){
      return ret.a + " " +ret.b + "i";
    };
  
    ret.theta=function(){
      return Math.atan2(ret.b,ret.a);
    };
    ret.conjugate=function(){
      return VectorLib.ComplexNumber(ret.a,-ret.b);
    };
    ret.real=function(){
      return ret.a;
    };
    ret.imag=function(){
      return ret.b;
    };
    
    return ret;
};

VectorLib.Surreal=function(){
  let ret={};

  ret.toSurreal=function(n, sofar, parents, iter){
      if(!iter && iter!==0){
          iter=0;
      }
      if(iter>100)return sofar;
      if(!parents){
         parents=[null,0,null];
      }
      if(!sofar)sofar=[];
      //need to abstract
      if(parents[1]===n)return sofar;
      if(n>parents[1]){
          sofar.push("R");
          if(parents[2]===null){
              return surreal(n,sofar,[parents[1],parents[1]+1,null], iter+1);
          }else{
              return surreal(n,sofar,[parents[1],(parents[2]+parents[1])/2,parents[2]], iter+1);
          }
      }
      if(n<parents[1]){
          sofar.push("L");
          if(parents[0]===null){
              return surreal(n,sofar,[null,parents[1]-1,parents[1]], iter+1);
          }else{
              return surreal(n,sofar,[parents[0],(parents[1]+parents[0])/2,parents[1]], iter+1);
          }
      }
          
  };
  return ret;
};

/****************************
Vector
=============================

*****************************/
VectorLib.Vector=function(v){
    if(v && v._isVector)return v;
    var v2={};
    v2._isVector=true;
    v2._arr=v.map(vv=>VectorLib.Number(vv));
    v2._sqNorm=null;
    v2._norm=null;
    v2._normalized=null;
    v2._nullSpace=null;
    
    v2.sqNorm=function(){
    	if(v2._sqNorm===null){
        //is this right for complex numbers?
      	v2._sqNorm = v2._arr.map(x=>x.multiply(x))
                            .reduce((a,b)=>a.add(b));
      }
      return v2._sqNorm;
    };
    v2.dim=function(){
    	return v2._arr.length;
    };
    v2.norm=function(){
    	if(v2._norm===null){
      	v2._norm= Math.sqrt(v2.sqNorm().mag());
      }
      return v2._norm;
    };
    
    v2.lNnorm=function(n){
      var sum=v2._arr.map(x=>x.pow(n))
      		           .reduce((a,b)=>a.add(b)).mag();
      return Math.pow(sum, 1.0/(n));
    };
    v2.lInfNorm=function(n){
      var sum=v2._arr.map(x=>x.mag())
      		           .reduce((a,b)=>a.max(b)).mag();
      return sum;
    };
    
    v2.asColumnMatrix=function(){
    	return VectorLib.Matrix(v2);
    };
    
    v2.asRowMatrix=function(){
    	return v2.asColumnMatrix().transpose();
    };
    v2.dot=function(u2){
    	u2 = VectorLib.Vector(u2);
      var ba=VectorLib.Number(0);
      var img=0;
      for(var i=0;i<Math.min(v2.dim(),u2.dim());i++){
      	ba=ba.add(v2._arr[i].multiply(u2._arr[i]));
      }
      return ba;
    };
    v2.addTo=function(arr){
    	if(arr.length>=v2._arr.length){
      	v2._arr.map((x,i)=>arr[i]=arr[i].add(x));
      }else{
      	throw "Cannot add vector to smaller array";
      }
      return arr;
    };
    v2.proj=function(u2){
    	u2 = VectorLib.Vector(u2);
      var un=u2.normalized();
      var pp=un.dot(v2);
      return un.scale(pp);
    };
    v2.slice=function(n){
    	return VectorLib.Vector(v2._arr.splice(0,n));
    };
    v2.resize=function(n){
    	if(n===v2._arr.length)return v2;
      var b=v2._arr.clone();
      b.length=n;
      b.fill(VectorLib.Number(0), Math.min(b.length,v2._arr.length),b.length);
    	return VectorLib.Vector(b);
    };
    //eliminates some dims
    v2.subspace=function(keep){
    	var narr=v2._arr.filter((a,i)=>keep[i]>0);
      return VectorLib.Vector(narr);
    };
    v2.scale=function(k2){
    	var ba=[];
      let k=VectorLib.Number(k2);
      for(var i=0;i<v2.dim();i++){
      	ba[i]=v2._arr[i].multiply(k);
      }
      var s= VectorLib.Vector(ba);
      if(v2._norm!==null)s._norm=v2._norm*k.mag();
      if(v2._sqNorm!==null)s._sqNorm=v2._sqNorm*k.sqMag();
      
      return s;
    };
    v2.normalized=function(){
    	if(!v2._normalized){
         v2._normalized=v2.scale(1.0/v2.norm());
         v2._normalized._normalized=v2._normalized;
         v2._normalized._norm=1;
         v2._normalized._sqNorm=1;
      }
      return v2._normalized;
    };
    v2.negate=function(){
    	var u2=v2._arr.map(x=>x.negate());
    	u2 = VectorLib.Vector(u2);
      u2._norm=v2._norm;
      u2._sqNorm=v2._sqNorm;
      return u2;
    };
    v2.add=function(u2){
    	u2 = VectorLib.Vector(u2);
      var bb=[];
      var maxlen = Math.max(v2.dim(),u2.dim());
      var minlen = Math.min(v2.dim(),u2.dim());
      bb.length=maxlen;
      
      for(var i=0;i<maxlen;i++){
      	if(i<minlen){
        	bb[i]=v2._arr[i].add(u2._arr[i]);
        }else{
        	if(i>=v2.dim()){
          	bb[i]=u2._arr[i];
          }else{
          	bb[i]=v2._arr[i];
          }
        }
      }
      return VectorLib.Vector(bb);
    };
     
    v2.factorOut=function(u2){
    	u2 = VectorLib.Vector(u2);
    	var un=u2.normalized();
      var p=un.dot(v2);
      var npro=un.scale(p.negate().conjugate());
      return v2.add(npro);
    };
    
    //this is a set of vectors which
    //are all orthogonal to each other
    //and to the original vector
    //TODO:
    // Doesn't work with complex vectors
    // also, I don't understand how this works
    // though I must have at some point
    v2.orthoBasis=function(){
      if(!v2._orthoBasis){
        var nn=[];
        var normed=v2.normalized();
      	for(var i=0;i<v2.dim();i++){
          //[0,0,i]
          // 0, then 0, then i
          var p   =normed._arr[i];
          //console.log(p);

          //Not totally sure why we should
          //do the conjugate here, but it seems
          //to work
          var pro =normed.scale(p.negate().conjugate());
          //console.log(pro);
          var delt=pro.add(VectorLib.unitVector(i));
          //console.log(delt.norm());
          if(Math.abs(delt.norm())>VectorLib.ZERO_TOLERANCE){
          	//nn.push(delt);
            
            for(var j=0;j<nn.length;j++){
              delt=delt.factorOut(nn[j]);
            }
            delt=delt.normalized();
            //console.log(delt);
            //let dot2=delt.dot(normed).mag();
            //console.log("dot2:" + dot2);
            if(Math.abs(delt.dot(normed).mag())<VectorLib.ZERO_TOLERANCE){
            	nn.push(delt);
            }
          }
        }
        v2._orthoBasis=nn;
      }
      return v2._orthoBasis;
    };
    
    v2.nullSpace=function(){
      if(!v2._nullSpace){
       	var obasis= v2.orthoBasis();
        //TOODO
        var marr=[];
        for(var i=0;i<obasis.length;i++){
        	marr.push(obasis[i]._arr.slice(0,v2.dim()-1));     
        }
        v2._nullSpace=VectorLib.Matrix(marr).transpose();
      }
      return v2._nullSpace;
    };

    return v2;
};

/***************
Matrix
================


***************/
VectorLib.Matrix=function(m){
    if(m && m._isMatrix)return m;
    if(m && m._isVector){
    	return VectorLib.Matrix([m._arr]).transpose();
    }
    var m2={};
    m2._isMatrix=true;
    m2._arr=m.map(r=>r.map(rr=>VectorLib.Number(rr)));
    m2._inverse=null;
    m2._ydim=m2._arr.length;
    m2._transpose=null;
    var maxX=0;
    var minX=10000;
    //first need to rank and order
    for(var i=0;i<m2._arr.length;i++){
    	var rv=m2._arr[i];
      maxX=Math.max(rv.length,maxX);
      minX=Math.min(rv.length,minX);
    }
    if(minX!=maxX){
    	for(var i=0;i<m2._arr.length;i++){
    		var rv=m2._arr[i];
        rv.length=maxX;
        for(var j=minX;j<maxX;j++){
        	if(!rv[j])rv[j]=0;
        }
      }
    }
    m2._xdim=maxX;
    
    m2.scale=function(s){
    	var res2= m2._arr.map(v=>v.map(c=>c.scale(s)));
      return VectorLib.Matrix(res2);
    };
    
    //this mutates, which isn't usually what we want
    m2.addScaleRow=function(s, r1, r2){
    	var row1=m2._arr[r1];
      var row2=m2._arr[r2];
      for(var i=0;i<row2.length;i++){
      	row2[i]=row2[i].add(row1[i].scale(s));
      }
      return m2;
    };
    m2.addScaleCol=function(s, c1,c2){
    	var col1=m2._arr.map(r=>r[c1]);
      var col2=m2._arr.map(r=>r[c2]);
      for(var i=0;i<col1.length;i++){
      	m2._arr[i][c2]=m2._arr[i][c2].add(m2._arr[i][c1].scale(s));
      }
      return m2;
    };
    //this mutates, which isn't usually what we want
    m2.scaleRow=function(s, r1){
    	var row1=m2._arr[r1];
      for(var i=0;i<row1.length;i++){
      	row1[i]=row1[i].scale(s);
      }
      return m2;
    };
    //this mutates, which isn't usually what we want
    m2.swapRows=function(r1,r2){
    	var row1=m2._arr[r1];
      var row2=m2._arr[r2];
      m2._arr[r1]=row2;
      m2._arr[r2]=row1;
      
      return m2;
    };
    m2.transpose=function(){
    	if(!m2._transpose){
      	var arr2=[];
        for(var i=0;i<m2._xdim;i++){
        	for(var j=0;j<m2._ydim;j++){
          	if(!arr2[i]){
          		arr2[i]=[];
          	}
          	arr2[i][j]=m2._arr[j][i];
        	}	
        }
        m2._transpose=VectorLib.Matrix(arr2);
        m2._transpose._transpose=m2;
      }
      return m2._transpose;
    };
    
    m2.clone=function(){
    	var m2clone= VectorLib.Matrix(m2._arr.map(a=>a.map(b=>b)));
      if(m2._inverse){
        //may need to clone
      	m2clone._inverse=m2._inverse;
      }
      return m2clone;
    };
    m2.asVector=function(){
    	if(m2._ydim===1){
      	return m2.transpose().asVector(); 
      }else if(m2._xdim===1){
      	return VectorLib.Vector(m2._arr);
      }
      throw "can only make vectors out of 1xn and nx1 matrices";
    
    };
    //010
    //000
    //100
    m2.inverse=function(){
    	return m2.inverseP(false).inverse;
    };
    m2.inverseP=function(b){
    
    	if(!m2._inverse){
        var nDiag=[];
      	if(m2._xdim!==m2._ydim){
        	throw "Cannot invert non-square matrix!";
        }
        var cop=m2.clone();
        var iden = VectorLib.identityMatrix(m2._xdim);
        var idenT = VectorLib.identityMatrix(m2._xdim);
    		for (var i=0;i<m2._xdim;i++){
          //only works if non-zero!!!
          var found=false;
          var nn=0.0;
          for(var k=i;k<m2._xdim;k++){
          	nn=cop._arr[k][i];
            if(nn.sqMag()>VectorLib.ZERO_TOLERANCE*VectorLib.ZERO_TOLERANCE){
          		found=true;
              if(k!==i){
              	cop.swapRows(i,k);
                iden.swapRows(i,k);
              }
              break;
            }
          }
          if(!found){
            if(!b)throw "Matrix is not invertible";
          	nDiag.push(i);
          }else{
        		var scale=1/nn;
          	cop.scaleRow(scale,i);
          	//console.log(cop.clone()._arr);
          	iden.scaleRow(scale,i);
          	for (var j=i+1;j<m2._xdim;j++){
          		var scale2=cop._arr[j][i];
            	cop.addScaleRow(-scale2,i,j);
            	iden.addScaleRow(-scale2,i,j);
          	}
          }
        }
        for (var i=m2._xdim-1;i>0;i--){
        	if(nDiag.indexOf(i)<0){
            for (var j=i-1;j>=0;j--){
              var scale2=cop._arr[j][i];
              cop.addScaleRow(-scale2,i,j);
              iden.addScaleRow(-scale2,i,j);
            }
          }
        }
        if(nDiag.length>0){
          for (var i=0;i<m2._xdim;i++){
            if(nDiag.indexOf(i)<0){
              for (var j=i+1;j<m2._xdim;j++){
                var scale2=cop._arr[i][j];
                cop.addScaleCol(-scale2,i,j);
                idenT.addScaleCol(-scale2,i,j);
              }
            }
          }
        }
        
        m2._inverse=iden;
        if(nDiag.length===0){
        	iden._inverse=m2;
        }
        m2._invertT=idenT;
        m2._nullDiag=nDiag;
        //console.log(cop);
      }
      return {
      "inverse":m2._inverse,
      "inverseT":m2._invertT,
      "nullDiag":m2._nullDiag
      };
    };
    
    m2.multiply=function(n2){
       n2=VectorLib.Matrix(n2);
       if(m2._xdim!=n2._ydim){
       		throw "cannot multiply matrices of incompatible dimensions:(" + m2._xdim + "x" + m2._ydim + ") vs (" + n2._xdim + "x" + n2._ydim + ") " + m2._xdim + "!=" +n2._ydim;
       }
       var res=[];
       res.length=m2._ydim;
       for(var y=0;y<m2._ydim;y++){
       		var rv=m2._arr[y];
          res[y]=[];
          res[y].length=n2._xdim;
          
          for(var x=0;x<n2._xdim;x++){
          	var s=VectorLib.Number(0);
          	
            //actual dot
            for(var i=0;i<rv.length;i++){
          		s=s.add(rv[i].multiply(n2._arr[i][x]));
          	}
            if(!res[y]){
            	res[y]=[s];
            }else{
            	res[y][x]=s;
            }
          }
       }
       return VectorLib.Matrix(res);
    };
    
    m2.nullSpace=function(){
    	var pInv=m2.inverseP(true);
      var vv= pInv.nullDiag.map(d=>{
      	var dv=VectorLib.unitVector(d).resize(m2._xdim);
        //console.log(dv);
      	return pInv.inverseT.multiply(dv).asVector().normalized();
      });
      for(var i=1;i<vv.length;i++){
      	for(var j=0;j<i;j++){
        	vv[i]=vv[i].factorOut(vv[j]);
        }
        vv[i]=vv[i].normalized();
      }
      return vv;
    };
    
    m2.eigendecompose=function(){
       if(m2._xdim!=m2._ydim){
       		throw "cannot decompose non-square matrix";
       }
       var matPow=[m2];
       
       var eigVec=[];
       var eigVal=[];
       
       var nsp=m2.nullSpace();
       
       
       for(var kk=0;kk<m2._ydim-nsp.length;kk++){
       	 var rrvec=null;
         var regen=true;
         var ui=0;
         var prev=0;
         var pmag=0;
         
         while(regen){
         	 regen=false;
         	 rrvec=VectorLib.randomVector(m2._xdim);
           for(var jj=0;jj<eigVec.length;jj++){
              var eVec=eigVec[jj];
              rrvec=rrvec.factorOut(eVec);
              if(rrvec.norm()<1E-7){
                regen=true;
                ui++;
                if(ui===m2._xdim){
                	throw "Trouble finding eigenvector";
                }
                break;
              }else if(rrvec.norm()<1E-3){
                rrvec=rrvec.normalized();
              }
           }
         }
         
         var rv=rrvec.resize(m2._xdim).asColumnMatrix();
         var MAX=10;
         for(var i=1;i<MAX;i++){
            if(!matPow[i]){
              matPow[i] = m2.multiply(matPow[i-1]);
            }	
            var nr = matPow[i].multiply(rv);
            var asVec=nr.asVector();
            
            for(var jj=0;jj<eigVec.length;jj++){
              var eVec=eigVec[jj];
              asVec=asVec.factorOut(eVec);
            }
            
            
            //console.log(asVec);
            var vmag= asVec.norm();
    
            if(pmag){
              var rat = vmag/pmag;
              var worked=false;
              //console.log(rat + " vs " + prev);
              if(Math.abs(rat-prev)<VectorLib.ZERO_TOLERANCE){
                worked=true;
              }else{
              	if(i===MAX-1){
                	worked=true;
                }else{
                	prev=rat;
                }
              }
              if(worked){
                  var nEig=asVec.normalized();
                  var m2M=m2.multiply(nEig).asVector();
                  var lam=m2M.dot(nEig);
                  
                  eigVal.push(lam);
                  eigVec.push(nEig);
                	break;
              }
            }
            //rv=nr;
            pmag=vmag;
         }
       }
       nsp.map(nsv=>eigVec.push(nsv));
       nsp.map(nsv=>eigVal.push(0));
       
       
       return {
       		"eVectors":eigVec,
          "eValues":eigVal
       };
    
    };
    
    return m2;

};


/***************************
MetricSpace
============================


****************************/
VectorLib.MetricSpace=function(){
	var ret={};
  ret._count=0;
  ret._cache={};
  ret.setCount=function(c){
  	ret._count=c;
    return ret;
  };
  ret.setItems=function(it){
  	ret._items=it;
    return ret.setCount(it.length);
  };
  ret.setDistance=function(f){
  	ret.distance=function(a,b){
      var k=Math.min(a,b)+":" + Math.max(a,b);
    	if(!ret._cache[k]){
      	if(ret._items){
        	ret._cache[k]=f(ret._items[a],ret._items[b]);
        }else{
      		ret._cache[k]=f(a,b);
        }
      }
      return ret._cache[k];
    };
    return ret;
  };
  ret.findLargestDistance=function(){
  	var maxDist=0;
    var off=[0,0];
    for(var i=0;i<ret._count;i++){
    	for(var j=i+1;j<ret._count;j++){
    		if(ret.distance(i,j)>maxDist){
        	maxDist=ret.distance(i,j);
          off=[i,j];
        }
      }
    }
    return off;
  };
  ret.approximateLargestDistance=function(){
  	var maxDist=0;
    var off=[0,0];
    var is=Math.floor(Math.random()*ret._count);
    
    for(var k=0;k<5;k++){
    	var found=false;
      for(var i=0;i<ret._count;i++){
        if(is!==i){
          var d=ret.distance(i,is);
          if(d>maxDist){
            maxDist=d;
            off=[is,i];
            found=true;
          }
        }
      }
      if(!found){
      	break;
      }
      is=off[1];
    }
    return off;
  };
  ret.swap=function(i,j){
  	return VectorLib.MetricSpace()
                     .setCount(ret._count)
    								 .setDistance((a,b)=>{
                     		if(a==i){
                        	a=j;
												}else if(a==j){
                        	a=i;
                        }
                        if(b==i){
                        	b=j;
                        }else if(b==j){
                        	b=i;
                        }
                     		return ret.distance(a,b);
                     });
  };
  ret.normalized=function(){
  	var off=builder.maxVariance();
    return ret.swap(0,off[0]).swap(1,off[1]);
  };
  ret.maxVariance=function(){
  	var maxVar=0;
    var maxIndex=[];
    for(var i=0;i<ret._count;i++){
    	for(var j=i+1;j<ret._count;j++){
      	var v=0;
        var d=ret.distance(i,j);
        for(var k=0;k<ret._count;k++){
      		var d1=ret.distance(i,k);
          var d3=ret.distance(j,k);
          var p=VectorLib.proj(d1,d,d3);
          v+=p*p;
        }
        if(v>maxVar){
        	maxVar=v;
          maxIndex=[i,j];
        }
    	}
    }
    return maxIndex;
  };
  //find the index of the item
  //with the smallest sum of
  //squared distances to all
  //other items
  ret.centroid=function(){
  	var minI=-1;
    var minSumSq=-1;
    for(var i=0;i<ret._count;i++){
    	var sqD=0;
    	for(var j=0;j<ret._count;j++){
        if(j!==i){
      	  var d=ret.distance(i,j);
          sqD+=d*d;
        }
      }
      if(sqD<minSumSq || minSumSq<0){
    		minSumSq=sqD;
      	minI=i;
    	}
    }
    return minI;
  };
  ret.strain=function(met){
  	if(met._count!=ret._count){
    throw "Cannot compare 2 metrics with different counts";
    }
    var sumSqDiff=0;
    for(var i=0;i<met._count;i++){
    	for(var j=i;j<met._count;j++){
    		var d1=ret.distance(i,j);
        var d2=met.distance(i,j);
        var diff=(d1-d2);
        sumSqDiff+=diff*diff;
      }
    }
    return sumSqDiff;
  };
  
  ret.embed=function(imag){
  	return VectorLib.embed(ret,imag);
  };
  
  return ret;
};

VectorLib.TestMetrics=function(){
  let ret={};
  //create a random metric using L2 norm,
  //sample in a unit box between the origin
  //and the point [1,1,1,...,1] in n dimensions
  //
  ret.randomL2Metric= function(d,n){
          if(!d)d=10;
          if(!n)n=2;
        	var pt2=[];
          for(var i=0;i<n;i++){
          	var pt=[];
          	for(var j=0;j<d;j++){
          		pt.push(Math.random());
            }
            pt2.push(pt);
          }
          return VectorLib.MetricSpace()
                           .setItems(pt2.map(p=>VectorLib.Vector(p)))
                           .setDistance((a,b)=>a.add(b.negate()).norm());
  };

  //create a 2D spiral metric
  ret.spiral=function(n){
    var xy=[];
    var dt=100.0/(180*Math.PI);
    
    for(var i=0;i<n;i++){
    	var s=Math.sqrt(i);
    	xy.push([s*Math.cos(dt*i),s*Math.sin(dt*i)]);
    }
    return VectorLib.MetricSpace()
                    .setItems(xy.map(p=>VectorLib.Vector(p)))
                    .setDistance((a,b)=>a.add(b.negate()).norm());
  };
  ret.fuzzyLine= function(n,noise){
    var xy=[];
    var m=2;

    if(!noise)noise=50;
    
    for(var i=0;i<n;i++){
    	xy.push([i,i*m+(Math.random()-0.5)*2*noise]);
    }
    return VectorLib.MetricSpace()
                   .setItems(xy.map(p=>VectorLib.Vector(p)))
                   .setDistance((a,b)=>a.add(b.negate()).norm());
  };

  return ret;

};

VectorLib.PCA = function(){
  let ret={};
  ret.pca=function(m){
      var vecs= m;
      if(m._items){
      	vecs=m._items;
      }
      //translate to the center
      var mat=ret.center(vecs);
      
      //"square" the matrix, really make the square covariant matrix
      //which has the property that it must be square, and must be
      //... probably symmetric?
      var cov=mat.transpose().multiply(mat);  
      var eig=cov.eigendecompose();
      var emat=VectorLib.Matrix(eig.eVectors.map(ev=>ev._arr));
      return emat.multiply(mat.transpose()).transpose();
  };

  ret.center=function(m){
    var vecs= m;
    if(m._items){
    	vecs=m._items;
    }
    var centerVec = [];
    centerVec.length=vecs[0].dim();
    centerVec.fill(0);
    vecs.map(vv=>vv.addTo(centerVec));
    centerVec = VectorLib.Vector(centerVec);
    centerVec = centerVec.scale(1.0/(vecs.length)).negate();
    
    
    var asMatrix=VectorLib.Matrix(vecs.map(v=>v.add(centerVec)._arr));
    
    return asMatrix;
  };
  
  return ret;

};

VectorLib.Tests=function(){
    let ret={};

    ret._tests=[];
    ret.assertEquals=function(a,b){
        if(a!==b) throw ("Assertion error:" + a + "!=" + b);
    };
    ret.assertTrue=function(a,msg){
        if(!msg) msg= a + " is not true";
        if(!a) throw ("Assertion error:" + msg);
    };
    ret.Test=function(ff,name){
      if(name && typeof name === "function"){
        let nm=ff;
        ff=name;
        name=nm;
      }
      
      let tst={};
      tst.name=name;
      tst.test=ff;
      tst.getName=function(){
          if(tst.name)return tst.name;
          return "Unnamed Test";
      };
      tst.setIndex=function(i){
        tst._index=i;
        return tst;
      };
      tst.run=function(){
        tst.test();
      };
      
      return tst;
    };
    ret.addTest=function(ff,name){
      let cc=ret._tests.length;
      ret._tests.push(ret.Test(ff,name).setIndex(cc));
    };

    ret.addTest("Embedded Linfinite Norm of 3 points should have no strain", ()=>{
      let ospace= VectorLib.MetricSpace()
                .setItems([[0,0],[2,1],[1,2]])
                .setDistance((a,b)=>{
          return a.map((aa,i)=>Math.abs(b[i]-a[i])).reduce((x,y)=>Math.max(x,y));
      });
      let embed=ospace.embed();
      ret.assertEquals(0,embed.strain(ospace));
      
    });

    ret.addTest("Embedding a real 10-D euclidiean metric should have no strain", ()=>{
		    
		    let ospace= VectorLib.TestMetrics().randomL2Metric(10,10);
	      let embed=ospace.embed();
	      let strain=embed.strain(ospace);
	      console.log(embed);
	      console.log(strain);
	      ret.assertTrue(strain<VectorLib.ZERO_TOLERANCE);
    });
    ret.addTest("Embedding a real 10-D euclidiean metric with 20 points should be at most 12-D", ()=>{
		    
		    let ospace= VectorLib.TestMetrics().randomL2Metric(10,20);
	      let embed=ospace.embed();
        console.log(embed);
        let ndim=embed._items[0].dim();
        ret.assertEquals(embed._items.length,20);
        ret.assertTrue(ndim>=10);
        ret.assertTrue(ndim<=12);
        console.log(ndim);
	      let strain=embed.strain(ospace);
	      console.log(embed);
	      console.log(strain);
	      ret.assertTrue(strain<VectorLib.ZERO_TOLERANCE);
    });

    ret.addTest("Embedded Linfinite Norm of 4 points should have no strain if using imaginary", ()=>{
      let ospace= VectorLib.MetricSpace()
                .setItems([[0,0],[2,1],[1,2],[1,1]])
                .setDistance((a,b)=>{
          return a.map((aa,i)=>Math.abs(b[i]-a[i])).reduce((x,y)=>Math.max(x,y));
      });
      let embed=ospace.embed(true);
      let strain=embed.strain(ospace);
      console.log(embed);
      console.log(strain);
      ret.assertEquals(0,strain);
      
    });

    ret.addTest("Embedded Linfinite Norm of 8 points should have no strain if using imaginary", ()=>{
      let ospace= VectorLib.MetricSpace()
                .setItems([[0,0],[2,1],[1,2],[1,1],[1,0],[0,1]])
                .setDistance((a,b)=>{
          return a.map((aa,i)=>Math.abs(b[i]-a[i])).reduce((x,y)=>Math.max(x,y));
      });
      let embed=ospace.embed(true);
      let strain=embed.strain(ospace);
      console.log(embed);
      console.log(strain);
      ret.assertEquals(0,strain);
      
    });
  
    ret.addTest("Dot product of unit vector with itself should be 1", ()=>{
      let vec=VectorLib.Vector([1231,4421,0.2,3]);
      let nvec=vec.normalized();
      ret.assertEquals(1,Math.round(nvec.dot(nvec)*10000)/10000);
      
    });
  
    ret.runAll=function(){
        let passed=0;
        let failed=0;
        ret._tests.map((t,i)=>{
          
            console.log("Running Test " + i + " (" + t.getName() + ") :");
            try{
              t.run();
              console.log("Test " + i + " (" + t.getName() + ") :" + " passed");
              passed++;
            }catch(e){
              console.log(e);
              console.log("Test " + i + " (" + t.getName() + ") :" + " failed");
              failed++;
            }
        });
        console.log("Tests passed:" + passed);
        console.log("Tests failed:" + failed);
    };  
  
    return ret;

};



/*
window["doPCA"]=function(){
   var v1=document.getElementById("input").value.trim();
   var mats=v1.split("\n")
               .filter(v=>v.trim().length>0)
               .map(v=>v.trim().replace(/ /g,"\t").split("\t").map(x=>x-0))
               .map(v=>VectorLib.Vector(v));
   var pc= pca(mats);
   var tt=pc._arr.map(x=>x.join("\t")).join("\n");
   document.getElementById("output").value=tt;
   
}
*/
