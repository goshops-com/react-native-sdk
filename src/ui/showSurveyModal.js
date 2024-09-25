import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet } from 'react-native';

const defaultConfig = {
  labels: {
    title: "How likely are you to recommend us to a friend or colleague?",
    feedbackPlaceholder: "Tell us a bit more about why you chose this score",
    submit: "Submit",
    close: "X"
  },
  styles: {
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
      margin: 20,
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 35,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5
    },
  },
  config: {
    minScore: 0,
    maxScore: 10,
    feedbackRequired: false
  }
};

export function showSurveyModal(options = {}) {
  const config = {
    labels: { ...defaultConfig.labels, ...options.labels },
    styles: { ...defaultConfig.styles, ...options.styles },
    config: { ...defaultConfig.config, ...options.config }
  };

  const SurveyModal = () => {
    const [modalVisible, setModalVisible] = useState(true);
    const [selectedScore, setSelectedScore] = useState(null);
    const [feedback, setFeedback] = useState('');

    const closeModal = () => {
      setModalVisible(false);
      if (options.onClose) options.onClose();
    };

    const submitFeedback = () => {
      if (options.onSubmit) {
        options.onSubmit(selectedScore, feedback);
      }
      closeModal();
    };

    const styles = StyleSheet.create(config.styles);

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>{config.labels.title}</Text>
            <View style={styles.scoreContainer}>
              {Array.from({ length: config.config.maxScore - config.config.minScore + 1 }, (_, i) => i + config.config.minScore).map((score) => (
                <TouchableOpacity
                  key={score}
                  style={[styles.scoreButton, selectedScore === score && styles.selectedScoreButton]}
                  onPress={() => setSelectedScore(score)}
                >
                  <Text style={styles.scoreButtonText}>{score}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              onChangeText={setFeedback}
              value={feedback}
              placeholder={config.labels.feedbackPlaceholder}
              multiline
            />
            <TouchableOpacity style={styles.submitButton} onPress={submitFeedback}>
              <Text style={styles.submitButtonText}>{config.labels.submit}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}>{config.labels.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return <SurveyModal />;
}