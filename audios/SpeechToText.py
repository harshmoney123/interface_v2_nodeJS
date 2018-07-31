#!/usr/bin/env python
# -*- coding: utf-8 -*-

#COMMAND F and search for "FILL WITH YOUR OWN" and fill in variables with your respective password and paths

import os
import sys
#from __future__ import print_function
import time
import boto3
from boto.s3.key import Key
import requests
import threading

# Imports the Google Cloud client library
from google.cloud import speech
from google.cloud.speech import types
from google.cloud.storage import Blob
from google.cloud import storage

from pydub import AudioSegment
from pydub.utils import which

AudioSegment.converter = which("ffmpeg")

class SttIntegrated:
    def __init__(self, file_path):
        self.inputFilePath = file_path

        # Hard-coding the path for credentials files or key/passwords:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = ''
        self.s3_region = "us-east-2"
        self.s3_bucket_name = "medicalrecordings"
        self.aws_access_key_id = ''
        self.aws_secret_access_key = ''
        self.IBM_username =  ""
        self.IBM_password = ""

    def google_stt(self):
        # Instantiates a client
        client = speech.SpeechClient()
        # Instantiates a client and uploads file
        storage_client = storage.Client()
        # Parameter is the name of the Google Cloud bucket
        bucket = storage_client.lookup_bucket('celerfama2')
        folder = bucket.list_blobs()
        with open(self.inputFilePath, 'rb') as file:
            blob = Blob(self.inputFilePath[7:], bucket)
            print("Google: Uploading: " + self.inputFilePath[7:])
            blob.upload_from_filename(self.inputFilePath)

        # Transcribes the file in the cloud
        for element in folder:
            print("Google: Transcribing " + element.name)
            audio = types.RecognitionAudio(uri="gs://celerfama2/" + element.name)
            config = types.RecognitionConfig(
                enable_word_time_offsets=True,
                language_code='en-US')

            # Detects speech in the audio file
            operation = client.long_running_recognize(config, audio)

            print('Google: Waiting for operation to complete...')
            response = operation.result()

            output_file = open(self.inputFilePath[:-4]+"Google" + ".txt", "w")

            for result in response.results:
                for alternative in result.alternatives:
                    output_file.write('Transcript: {}'.format(alternative.transcript.encode("utf-8")) + '\n')
                    output_file.write("Confidence: " + str(alternative.confidence) + '\n')
                # # Below can be commented to get the detailed info for each word.
                # for word_info in alternative.words:
                #     word = word_info.word
                #     start_time = word_info.start_time
                #     end_time = word_info.end_time
                #     output_file.write('Word: {}, start_time: {}, end_time: {}'.format(
                #         word,
                #         start_time.seconds + start_time.nanos * 1e-9,
                #         end_time.seconds + end_time.nanos * 1e-9))
                #     output_file.write("\n")
            output_file.close()
            print("Google: Operation Complete")
            element.delete()
            return

    def amazon_stt(self):

        #Accessing Amazon S3 bucket (existing) and uploading sound file (.wav)
        s3 = boto3.resource('s3',aws_access_key_id=aws_access_key_id, aws_secret_access_key=aws_secret_access_key)
        bucket = s3.Bucket(self.s3_bucket_name)
        bucket.upload_file(self.inputFilePath, self.inputFilePath[7:])

        #Using Amazon Transcription Services
        transcribe = boto3.client('transcribe', aws_access_key_id=aws_access_key_id,
                                  aws_secret_access_key=aws_secret_access_key,
                                  region_name=self.s3_region)
        ticks = str(time.time())
        job_name = "Transcribing" + self.inputFilePath[7:] + ticks
        job_uri = "http://" + self.s3_bucket_name + ".s3-" + self.s3_region + ".amazonaws.com/" + self.inputFilePath[7:]
        transcribe.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={'MediaFileUri': job_uri},
            MediaFormat='wav',
            LanguageCode='en-US'
        )
        print("Amazon:Transcribing " + self.inputFilePath[7:])
        #Returns status on transcription job
        while True:
            status = transcribe.get_transcription_job(TranscriptionJobName=job_name)
            if status['TranscriptionJob']['TranscriptionJobStatus'] in ['COMPLETED', 'FAILED']:
                break
            print("Amazon:  Waiting for operation to complete...")
            time.sleep(10)
        #print(status)  <--can uncomment

        link = status.get('TranscriptionJob').get('Transcript').get('TranscriptFileUri')
        # Writes the transcript to a file
        trans_file = requests.get(link)
        file_name = self.inputFilePath[:-4]+"AWS" + ".txt"
        output_file = open(file_name, 'wb')
        output_file.write(trans_file.content)
        output_file.close()
        print("Amazon: Transcription complete.")
        return

    def ibm_stt(self):
        # IBM bluemix API url
        url = 'https://stream.watsonplatform.net/speech-to-text/api/v1/recognize'

          # bluemix authentication username
        username = self.IBM_username

         # bluemix authentication password
        password = self.IBM_password

        headers = {'Content-Type': 'audio/wav'}

        print("IBM:Transcribing " + self.inputFilePath[7:])
         # Open audio file(.wav) in wave format
        audio = open(self.inputFilePath, 'rb')

        r = requests.post(url, data=audio, headers=headers, auth=(username, password))

         # create the json file out of
        file_name = self.inputFilePath[:-4]
        #with open(file_name + "IBM" + ".txt", 'w') as f:
        #   sys.stdout = f
        #  print(r.text)
        output_file = open(file_name + "IBM" + ".txt", 'w')
        output_file.write(r.text)
        output_file.close()
        print("IBM: Transcription complete.")

    def main(self):
        google = threading.Thread(name='googleSTT', target= self.google_stt)
        # amazon = threading.Thread(name='amazonSTT', target= self.amazon_stt)
        ibm = threading.Thread(name='ibmSTT', target= self.ibm_stt)
        google.start()
        # amazon.start()
        ibm.start()
        google.join()
        # amazon.join()
        ibm.join()
        #return "speech to text finished"

# to run it from console like a simple script use
if __name__ == "__main__":
    if len(sys.argv) == 1:
        print("Error: Input file required")
        sys.exit(2)
    t2c = SttIntegrated(sys.argv[1])
    t2c.main()