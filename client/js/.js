//Function for getting string similarity. I did not write this.
const getStringSimilarity = (s1, s2) => {
	let longer = s1;
	let shorter = s2;
	if (s1.length < s2.length) {
		longer = s2;
		shorter = s1;
	}
	const longerLength = longer.length;
	if (longerLength == 0) return 1;
	return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
};
function editDistance(s1, s2) {
	s1 = s1.toLowerCase();
	s2 = s2.toLowerCase();

	var costs = new Array();
	for (var i = 0; i <= s1.length; i++) {
		var lastValue = i;
		for (var j = 0; j <= s2.length; j++) {
			if (i == 0) costs[j] = j;
			else {
				if (j > 0) {
					var newValue = costs[j - 1];
					if (s1.charAt(i - 1) != s2.charAt(j - 1))
						newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
					costs[j - 1] = lastValue;
					lastValue = newValue;
				}
			}
		}
		if (i > 0) costs[s2.length] = lastValue;
	}
	return costs[s2.length];
}

const search = (input, testAgainst) => {
	let splitInput = input.split(' ');
    //Transforms the testAgainsit into an array of the index and its score
	let output = testAgainst.map((s, j) => {
    	//Removes all non letters and converts to lowercase 
		let splitTitle = s.title
			.replace(/^[^a-zA-Z]*$/, '')
			.toLowerCase()
			.split(' ');
		let splitDescription = s.title
			.replace(/^[^a-zA-Z]*$/, '')
			.toLowerCase()
			.split(' ');
		//Variable holding the score value
		let i = 0;
		if (s.title === input) i += 10;
		if (s.description.match(new RegExp(`${input}`))) i += 5;
		if (s.desription === input) i += 7;
		if (s.title.match(new RegExp(`${input}`))) i += 6;
        //Each word in title or description are worth 2 and 1 point respectively
		splitTitle.forEach((s) => {if(splitInput.indexOf(s) != -1) i+= 2});
        //loops through descri
		splitDescription.forEach((s) => {if(splitInput.indexOf(s) != -1) i++});
        //Similarity between title and description
		let tSim = getStringSimilarity(input, s.title);
		let dSim = getStringSimilarity(input, s.description);
        if(tSim < dSim) i *= dSim
        else i *= tSim
		tSim < dSim ? (i *= dSim) : (i *= tSim);
		console.log(i);
		return [i, j];
	});
	output.sort((a, b) => b[0] - a[0]);
	return testAgainst[output[0][1]];
};