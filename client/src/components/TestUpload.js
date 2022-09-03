import React, { useState } from "react"
import { Link } from "react-router-dom"

const TestUpload = () => {
	const [imageURL, setImageURL] = useState('')
	let filepath = undefined

	const handleUploadImage = (e) => {
		e.preventDefault();
		console.log('startHandle')
		console.log(filepath)

		if (filepath === undefined)
			return

		const data = new FormData()
		data.append('file', filepath)
		console.log(data)
		
		fetch('/upload', {
			method: 'POST',
			body: data,
		}).then(response => {
			const promise = response.json()
			promise.then(body => {
				setImageURL(body)
				console.log('post', body)
			})
		})
		
		console.log("endHandle")
		
	}

	const handleFilepathChange = (e) => {
		console.log(e.target.files[0])
		filepath = e.target.files[0]
	}

	// ref={(ref) => { filepath = ref; console.log('Test ', ref)}}
	return (
		<div>
			<div>
				<input type="file" onChange={handleFilepathChange} />
			</div>
			<br />
			<div>
				<input type="button" onClick={handleUploadImage} value="Upload" />
			</div>
			<img src={imageURL} alt="img" />
			<br />
			<img src={"http://localhost:3000/img/38UNp4Gt-d8.jpg"} alt="img" />

			<Link to="/"> Main </Link>
		</div>
	)
}

export default TestUpload