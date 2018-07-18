#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
#from __future__ import print_function
import time
import boto3
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
        # Hard-coding the path for credentials file downloaded from Google API dashboard.
        
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/wangruohan/Documents/nlp/88cb41572f69.json"

        # fix as necessary
        self.s3_region = "us-east-2"
        self.s3_bucket_name = "celerfama"

    def google_stt(self):
        # Instantiates a client
        client = speech.SpeechClient()
        
        sound = AudioSegment.from_file(self.inputFilePath, format="webm")
        # if(sound.channels != 1):#If it's not mono
        sound = sound.set_channels(1)#Change it to mono
        sound.export(self.inputFilePath, format="wav")#Export them as wav files
        print('Conversion complete')
        # Instantiates a client and uploads file
        storage_client = storage.Client()
        # Parameter is the name of the Google Cloud bucket
        bucket = storage_client.lookup_bucket('celerfama2')
        folder = bucket.list_blobs()
        with open(self.inputFilePath, 'rb') as file:
            blob = Blob(os.path.basename(file.name), bucket)
            print("Google: Uploading: " + os.path.basename(file.name))
            blob.upload_from_filename(self.inputFilePath)

        # Transcribes the file in the cloud
        for element in folder:
            print("Google: Transcribing " + element.name)
            audio = types.RecognitionAudio(uri="gs://celerfama2/" + element.name)
            config = types.RecognitionConfig(
                # Option to get word specific info like time stamps
                enable_word_time_offsets=True,
                # Language of the audio
                language_code='en-US')

            # Detects speech in the audio file
            operation = client.long_running_recognize(config, audio)

            print('Google: Waiting for operation to complete...')
            response = operation.result()

            file_name = element.name[:-4]
            output_file = open(file_name+"Google" + ".txt", "w")

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
        transcribe = boto3.client('transcribe', aws_access_key_id='AKIAIPLJH4IPQUJ36IBA',
                                  aws_secret_access_key='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',
                                  region_name='us-east-2')
        ticks = str(time.time())
        job_name = "Transcribing" + self.inputFilePath + ticks
        job_uri = "http://" + self.s3_bucket_name + ".s3-" + self.s3_region + ".amazonaws.com/speech.webm"
        transcribe.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={'MediaFileUri': job_uri},
            MediaFormat='wav',
            LanguageCode='en-US'
        )
        print("Amazon:Transcribing " + self.inputFilePath)

        while True:
            status = transcribe.get_transcription_job(TranscriptionJobName=job_name)
            if status['TranscriptionJob']['TranscriptionJobStatus'] in ['COMPLETED', 'FAILED']:
                break
            print("Amazon:  Waiting for operation to complete...")
            time.sleep(10)
        #print(status)

        link = status.get('TranscriptionJob').get('Transcript').get('TranscriptFileUri')
        # Writes the transcript to a file
        trans_file = requests.get(link)
        file_name = self.inputFilePath[:-4]+"AWS" + ".txt"
        open(file_name, 'wb').write(trans_file.content)
        print("Amazon: Transcription complete.")
        return

    def main(self):
        google = threading.Thread(name='googleSTT', target= self.google_stt )
        amazon = threading.Thread(name='amazonSTT', target= self.amazon_stt)
        google.start()
        amazon.start()
        google.join()
        amazon.join()
        #return "speech to text finished"

# to run it from console like a simple script use
if __name__ == "__main__":
    if len(sys.argv) == 1:
        print("Error: Input file required")
        sys.exit(2)
    t2c = SttIntegrated(sys.argv[1])
    t2c.main()